"""Rivers Design site-map generator (React version).

One noise heightfield drives everything so it all agrees:
  - public/assets/contours.svg   organic topo background + rivers
  - src/data/mapTrails.js        terrain-following trail <path> data,
                                  computed by A* over the heightfield
                                  so they curve around peaks and hug
                                  gentler terrain instead of cutting
                                  straight through — consumed by
                                  src/components/MapMenu.jsx

Waypoint positions/labels/hrefs live by hand in
src/data/mapWaypoints.js (small, hand-authored, tightly coupled to
React Router paths) — this script only owns the generated geometry,
printing snapped positions + zoom targets for hand-copy.

Run from anywhere; edit SEED to re-roll the landscape.
"""
import random, math, io, os, heapq

SEED = 7
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

W, H = 1000, 600
GW, GH = 140, 84      # finer grid than before — more, denser contour lines
LEVELS = 26            # real topo sheets read as dense; index line every 5th

random.seed(SEED)

# ---------------- heightfield ----------------
# Real topo sheets aren't uniform noise — they're a handful of actual
# peaks (contours packed tight on the flanks) sitting in mostly flat,
# sparse valleys. Model that directly: sum of localized Gaussian
# "peaks" at random points/sizes/heights, so line DENSITY communicates
# elevation change the way it does on a real map, plus a faint broad
# undulation underneath so valleys aren't a dead flat zero.
def make_lattice(n, m):
    return [[random.random() for _ in range(m)] for _ in range(n)]

def smoothstep(t):
    return t * t * (3 - 2 * t)

def sample(lat, x, y):
    n, m = len(lat), len(lat[0])
    x0, y0 = int(x) % n, int(y) % m
    x1, y1 = (x0 + 1) % n, (y0 + 1) % m
    tx, ty = smoothstep(x - int(x)), smoothstep(y - int(y))
    a = lat[x0][y0] * (1 - tx) + lat[x1][y0] * tx
    b = lat[x0][y1] * (1 - tx) + lat[x1][y1] * tx
    return a * (1 - ty) + b * ty

NUM_PEAKS = 22
peaks = []
for _ in range(NUM_PEAKS):
    cx = random.uniform(-60, W + 60)
    cy = random.uniform(-60, H + 60)
    r = random.uniform(65, 230)
    h = random.uniform(0.4, 1.0)
    peaks.append((cx, cy, r, h))

base_octaves = [(make_lattice(5, 4), 1.0), (make_lattice(10, 8), 0.5)]

field = [[0.0] * (GH + 1) for _ in range(GW + 1)]
lo, hi = 1e9, -1e9
for i in range(GW + 1):
    for j in range(GH + 1):
        x, y = i / GW * W, j / GH * H
        peak_v = 0.0
        for cx, cy, r, h in peaks:
            dx, dy = x - cx, y - cy
            d2 = (dx * dx + dy * dy) / (r * r)
            if d2 < 9:  # skip negligible tails
                peak_v += h * math.exp(-3.2 * d2)
        base_v = 0.0
        for lat, amp in base_octaves:
            n, m = len(lat), len(lat[0])
            base_v += amp * sample(lat, i / (GW + 1) * (n - 1) * 1.3, j / (GH + 1) * (m - 1) * 1.3)
        v = peak_v * 0.88 + base_v * 0.3
        field[i][j] = v
        lo, hi = min(lo, v), max(hi, v)
for i in range(GW + 1):
    for j in range(GH + 1):
        field[i][j] = (field[i][j] - lo) / (hi - lo)

def fval(x, y):
    gx = min(max(x / W * GW, 0), GW - 0.001)
    gy = min(max(y / H * GH, 0), GH - 0.001)
    i, j = int(gx), int(gy)
    tx, ty = gx - i, gy - j
    a = field[i][j] * (1 - tx) + field[i + 1][j] * tx
    b = field[i][j + 1] * (1 - tx) + field[i + 1][j + 1] * tx
    return a * (1 - ty) + b * ty

# ---------------- smoothing helpers ----------------
def laplacian_smooth(pts, closed, iterations=3, factor=0.55):
    pts = list(pts)
    n = len(pts)
    if n < 3:
        return pts
    for _ in range(iterations):
        out = list(pts)
        rng = range(n) if closed else range(1, n - 1)
        for i in rng:
            a = pts[(i - 1) % n]
            b = pts[(i + 1) % n]
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            out[i] = (pts[i][0] + factor * (mx - pts[i][0]),
                      pts[i][1] + factor * (my - pts[i][1]))
        pts = out
    return pts

def catmull_path(pts, closed=False):
    if closed:
        ext = [pts[-1]] + pts + [pts[0], pts[1]]
    else:
        ext = [pts[0]] + pts + [pts[-1]]
    d = [f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    if closed:
        d.append("Z")
    return "".join(d)

# ---------------- contours (marching squares -> smoothed spline) ----------------
def interp(pa, pb, va, vb, iso):
    t = 0.5 if abs(vb - va) < 1e-12 else (iso - va) / (vb - va)
    return (pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1]))

def segments_for(iso):
    segs = []
    sx, sy = W / GW, H / GH
    for i in range(GW):
        for j in range(GH):
            x, y = i * sx, j * sy
            corners = [(x, y), (x + sx, y), (x + sx, y + sy), (x, y + sy)]
            vals = [field[i][j], field[i + 1][j], field[i + 1][j + 1], field[i][j + 1]]
            idx = sum(1 << k for k, v in enumerate(vals) if v > iso)
            if idx in (0, 15):
                continue
            crossings = []
            for a, b in ((0, 1), (1, 2), (2, 3), (3, 0)):
                if (vals[a] > iso) != (vals[b] > iso):
                    crossings.append(interp(corners[a], corners[b], vals[a], vals[b], iso))
            if len(crossings) >= 2:
                segs.append((crossings[0], crossings[1]))
                if len(crossings) == 4:
                    segs.append((crossings[2], crossings[3]))
    return segs

def key_of(p):
    return (round(p[0], 1), round(p[1], 1))

def chain(segs):
    adj = {}
    for s in segs:
        a, b = key_of(s[0]), key_of(s[1])
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)
    seen, lines = set(), []
    for start in adj:
        if start in seen or len(adj[start]) != 1:
            continue
        line, cur, prev = [start], start, None
        seen.add(start)
        while True:
            nxts = [p for p in adj[cur] if p != prev and p not in seen]
            if not nxts:
                break
            prev, cur = cur, nxts[0]
            seen.add(cur)
            line.append(cur)
        lines.append((line, False))
    for start in adj:
        if start in seen:
            continue
        line, cur, prev = [start], start, None
        seen.add(start)
        while True:
            nxts = [p for p in adj[cur] if p != prev and p not in seen]
            if not nxts:
                line.append(start)
                break
            prev, cur = cur, nxts[0]
            seen.add(cur)
            line.append(cur)
        lines.append((line, True))
    return lines

# ---------------- hypsometric fill bands (colored elevation tint) ----------------
# Real topo sheets tint by elevation — green valley floors through tan
# high ground to pale gray/white peaks — not a flat dark backdrop.
# Painter's algorithm: start with a full-canvas rect in the lowest
# band's color, then for each threshold (ascending) fill just the
# CLOSED marching-squares loops (peaks/basins that don't touch the
# canvas edge — open, edge-crossing loops are skipped since closing
# them correctly means following the canvas boundary, not worth the
# complexity here) with the next band's color. Since each successive
# threshold's closed regions nest inside the previous one, layering
# low-to-high naturally produces correct-looking bands without ever
# computing an isoband polygon directly.
FILL_LEVELS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]
FILL_COLORS = ["#8fae63", "#9dbb70", "#aec97f", "#c3c085", "#cdb079", "#c4a06e", "#ddd6c4"]

parts = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="{FILL_COLORS[0]}"/>']
for lvl_i, iso in enumerate(FILL_LEVELS):
    color = FILL_COLORS[lvl_i + 1]
    ds = []
    for line, closed in chain(segments_for(iso)):
        if not closed or len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        smooth = laplacian_smooth(thin, closed=True, iterations=3, factor=0.6)
        ds.append(catmull_path(smooth, closed=True))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" fill="{color}" fill-rule="evenodd"/>')

for li in range(1, LEVELS + 1):
    iso = li / (LEVELS + 1)
    # real topo sheets bold every 5th contour as an "index line" and
    # keep the rest faint — more contrast between the two than before
    index_line = (li % 5 == 0)
    # brown contour lines over the color-tinted terrain, not the flat
    # gray that worked on a plain dark backdrop
    stroke = "#6b4a2b" if index_line else "#8a6a45"
    width = "1.4" if index_line else "0.7"
    opacity = "0.75" if index_line else "0.45"
    ds = []
    for line, closed in chain(segments_for(iso)):
        if len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        smooth = laplacian_smooth(thin, closed, iterations=3, factor=0.6)
        ds.append(catmull_path(smooth, closed=closed))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" stroke="{stroke}" stroke-width="{width}" opacity="{opacity}"/>')

# contours.svg isn't written yet — rivers (below) get appended to
# `parts` first so they render in the same background image, and the
# file write happens once at the very end of the script.

# ---------------- waypoint positions (must match src/data/mapWaypoints.js) ----------------
# key -> (x%, y%) — rough layout intent, hand-tuned for spacing and
# label clearance. Snapped below onto real terrain features (hubs to
# the nearest peak summit, sub-pages to the nearest valley floor) so
# dots land on actual high/low points instead of floating on a slope.
POSITIONS_INTENT = {
    "home": (50, 16),
    "experience": (22, 42),
    "work": (14, 68),
    "sunthru": (5, 81),
    "dreki": (27, 57),
    "resume": (32, 76),
    "projects": (56, 46),
    "completed": (40, 76),
    "pyro-mk7": (18, 66),
    "hephaestus-forge": (52, 66),
    "in-progress": (60, 80),
    "wip-1": (62, 94),
    "planned": (78, 72),
    "plan-1": (66, 84),
    "plan-2": (97, 45),
    "about": (82, 40),
    "contact": (87, 68),
}
HUB_KEYS = {"home", "experience", "projects", "about"}
SNAP_RADIUS = 95  # canvas units — keeps the snap close to the intended spot
# Leaf pages (individual project/role pages) sit near their parent —
# a full-size search radius lets two siblings' windows overlap so much
# they can snap onto the exact same valley cell. Shrink it just for
# these so each settles on its own nearby low point, while the
# POSITIONS_INTENT deltas above keep them well clear of the parent
# itself (see the parent-distance check below — cramped nav points
# are hard to tell apart or click accurately).
LEAF_KEYS = {"pyro-mk7", "hephaestus-forge", "wip-1", "plan-1", "plan-2", "sunthru", "dreki"}
LEAF_SNAP_RADIUS = 40
PARENT_OF = {
    "pyro-mk7": "completed", "hephaestus-forge": "completed",
    "wip-1": "in-progress",
    "plan-1": "planned", "plan-2": "planned",
    "sunthru": "work", "dreki": "work",
}

def nearest_peak_center(x0, y0):
    best, best_d2 = (x0, y0), 1e18
    for cx, cy, r, h in peaks:
        d2 = (cx - x0) ** 2 + (cy - y0) ** 2
        if d2 < best_d2:
            best_d2, best = d2, (cx, cy)
    return best

# A handful of grid cells often form the single deepest basin in the
# whole map — several different intents' search windows can overlap
# it and every one of them "snaps" to that exact same point. Track
# which cells are already spoken for and exclude them from later
# searches, so each new point settles on its OWN nearby low spot
# instead of piling onto whichever valley happens to be lowest overall.
claimed_cells = set()

def local_extremum(x0, y0, radius, seek_max, avoid_claimed=False):
    gx0, gy0 = x0 / W * GW, y0 / H * GH
    gr_x, gr_y = radius / W * GW, radius / H * GH
    i0, i1 = max(0, int(gx0 - gr_x)), min(GW, int(gx0 + gr_x))
    j0, j1 = max(0, int(gy0 - gr_y)), min(GH, int(gy0 + gr_y))
    best_v = -1e18 if seek_max else 1e18
    best_xy = None
    for i in range(i0, i1 + 1):
        for j in range(j0, j1 + 1):
            if avoid_claimed and (i, j) in claimed_cells:
                continue
            v = field[i][j]
            if (v > best_v) if seek_max else (v < best_v):
                best_v, best_xy = v, (i / GW * W, j / GH * H)
    if best_xy is None:
        # whole window already claimed (very tight search radius,
        # heavily contested area) — fall back to allowing it anyway
        return local_extremum(x0, y0, radius, seek_max, avoid_claimed=False)
    return best_xy

def nearest_valley(x0, y0, radius):
    return local_extremum(x0, y0, radius, seek_max=False, avoid_claimed=True)

def claim(sx, sy, radius=25):
    gx0, gy0 = sx / W * GW, sy / H * GH
    gr_x, gr_y = radius / W * GW, radius / H * GH
    i0, i1 = max(0, int(gx0 - gr_x)), min(GW, int(gx0 + gr_x))
    j0, j1 = max(0, int(gy0 - gr_y)), min(GH, int(gy0 + gr_y))
    for i in range(i0, i1 + 1):
        for j in range(j0, j1 + 1):
            claimed_cells.add((i, j))

POSITIONS = {}
print("Snapped waypoint positions (elevation / displacement from intent):")
for pkey, (x, y) in POSITIONS_INTENT.items():
    x0, y0 = x / 100 * W, y / 100 * H
    if pkey in HUB_KEYS:
        sx, sy = nearest_peak_center(x0, y0)
        # a hub can end up far from a sparse peak — don't wander past
        # the search radius, just settle for the steepest nearby spot
        if math.hypot(sx - x0, sy - y0) > SNAP_RADIUS * 1.6:
            sx, sy = local_extremum(x0, y0, SNAP_RADIUS * 1.6, seek_max=True)
    else:
        radius = LEAF_SNAP_RADIUS if pkey in LEAF_KEYS else SNAP_RADIUS
        sx, sy = nearest_valley(x0, y0, radius)
    sx = min(max(sx, 15), W - 15)
    sy = min(max(sy, 15), H - 15)
    claim(sx, sy)
    dist = round(math.hypot(sx - x0, sy - y0))
    POSITIONS[pkey] = (round(sx / W * 100, 1), round(sy / H * 100, 1))
    kind = "peak" if pkey in HUB_KEYS else "valley"
    print(f"  {pkey:18s} ({kind:6s}) -> x={POSITIONS[pkey][0]:5.1f}%  y={POSITIONS[pkey][1]:5.1f}%  "
          f"elev={fval(sx, sy):.2f}  moved={dist}u")

# flag any two leaf siblings that landed suspiciously close together
# (same valley cell) so POSITIONS_INTENT can be nudged and re-run
SIBLING_GROUPS = [
    ("pyro-mk7", "hephaestus-forge"), ("plan-1", "plan-2"), ("sunthru", "dreki"),
]
# in-progress only has the one placeholder page so far — nothing to
# check it against yet, add its sibling pair here once a 2nd exists
for a, b in SIBLING_GROUPS:
    ax, ay = POSITIONS[a][0] / 100 * W, POSITIONS[a][1] / 100 * H
    bx, by = POSITIONS[b][0] / 100 * W, POSITIONS[b][1] / 100 * H
    sep = math.hypot(ax - bx, ay - by)
    if sep < 12:
        print(f"  !! {a} and {b} snapped only {sep:.1f}u apart — nudge POSITIONS_INTENT and re-run")

# flag any leaf that landed too close to the larger point it zooms
# from — cramped nav points are hard to tell apart or click precisely
for child, parent in PARENT_OF.items():
    cx, cy = POSITIONS[child][0] / 100 * W, POSITIONS[child][1] / 100 * H
    px, py = POSITIONS[parent][0] / 100 * W, POSITIONS[parent][1] / 100 * H
    sep = math.hypot(cx - px, cy - py)
    flag = " !! too close to parent, nudge POSITIONS_INTENT" if sep < 60 else ""
    print(f"  {child:18s} <-> {parent:10s} parent distance = {sep:.0f}u{flag}")

N = {k: (x / 100 * W, y / 100 * H) for k, (x, y) in POSITIONS.items()}

# ---------------- zoom targets for the map's two zoom levels ----------------
# Prints {fx, fy, scale} for each zoomable node's children, hand-copied
# into mapWaypoints.js's `zoomTargets` (fx/fy are 0..1 fractions of the
# container, scale capped so a tight cluster doesn't zoom absurdly far).
def zoom_target_for(member_keys, pad=0.09, max_scale=3.2):
    xs = [POSITIONS[k][0] / 100 for k in member_keys]
    ys = [POSITIONS[k][1] / 100 for k in member_keys]
    minx, maxx = min(xs) - pad, max(xs) + pad
    miny, maxy = min(ys) - pad, max(ys) + pad
    # scale is a single scalar applied to both axes (see MapMenu.jsx
    # applyZoom) — constrain by whichever span is LARGER, not smaller.
    # Members that happen to share a near-identical x or y (e.g. two
    # children at the same y) would otherwise collapse that axis's
    # span to ~0 and force an absurd zoom just from that coincidence.
    span = max(maxx - minx, maxy - miny, 0.01)
    scale = min(1 / span, max_scale)
    fx, fy = (minx + maxx) / 2, (miny + maxy) / 2
    # Clamp so the scaled scene always fully covers the viewport — a
    # center too close to 0 or 1 would translate the scene past its own
    # edge and expose blank space beyond it (see the matching clamp in
    # MapMenu.jsx's applyZoom, which also enforces this at runtime).
    margin = 0.5 / scale
    fx = min(max(fx, margin), 1 - margin)
    fy = min(max(fy, margin), 1 - margin)
    return {"fx": round(fx, 3), "fy": round(fy, 3), "scale": round(scale, 2)}

print("\nZoom targets (fx, fy, scale) — hand-copy into mapWaypoints.js zoomTargets:")
ZOOM_GROUPS = {
    "experience": ["work", "resume"],
    "projects": ["completed", "in-progress", "planned"],
    "about": ["contact"],
    "completed": ["pyro-mk7", "hephaestus-forge"],
    "in-progress": ["wip-1"],
    "planned": ["plan-1", "plan-2"],
    "work": ["sunthru", "dreki"],
}
for node, members in ZOOM_GROUPS.items():
    print(f"  {node:10s}: {zoom_target_for(members)}")

# (from, to, kind, cluster) — cluster "hub" always visible; others only
# visible while their cluster is the active zoom. Parent->child links
# use the child's own cluster; sibling ("s") links use the shared
# parent cluster.
LINKS = [
    ("home", "experience", "p", "hub"), ("home", "projects", "p", "hub"), ("home", "about", "p", "hub"),
    ("experience", "work", "p", "experience"), ("experience", "resume", "p", "experience"),
    ("projects", "completed", "p", "projects"), ("projects", "in-progress", "p", "projects"),
    ("projects", "planned", "p", "projects"),
    ("about", "contact", "p", "about"),
    ("experience", "projects", "s", "hub"), ("projects", "about", "s", "hub"),
    ("work", "resume", "s", "experience"),
    ("completed", "in-progress", "s", "projects"), ("in-progress", "planned", "s", "projects"),
    ("completed", "pyro-mk7", "p", "completed"), ("completed", "hephaestus-forge", "p", "completed"),
    ("in-progress", "wip-1", "p", "in-progress"),
    ("planned", "plan-1", "p", "planned"), ("planned", "plan-2", "p", "planned"),
    ("work", "sunthru", "p", "work"), ("work", "dreki", "p", "work"),
    ("pyro-mk7", "hephaestus-forge", "s", "completed"),
    ("plan-1", "plan-2", "s", "planned"),
    ("sunthru", "dreki", "s", "work"),
]

# ---------------- rivers (steepest-descent flow trace) ----------------
CELL_DX, CELL_DY = W / GW, H / GH

def grid_neighbors8(i, j):
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            if di == 0 and dj == 0:
                continue
            ni, nj = i + di, j + dj
            if 0 <= ni <= GW and 0 <= nj <= GH:
                yield ni, nj

def trace_river(start_xy, max_dist):
    # Real valley floors are mostly flat (see the heightfield comment
    # up top), so a discrete grid-hop steepest-descent walk stalls out
    # constantly once the ground levels off, and picking "whichever
    # unvisited neighbor is lowest" to push through a stall tends to
    # wander/spiral across a large flat basin instead of heading
    # anywhere in particular. Trace in continuous space instead: at
    # each step, probe a ring of directions around the current point
    # for the steepest nearby drop and steer the running flow
    # direction toward it; if nothing nearby is downhill (flat ground),
    # keep coasting in that same established direction. Since motion is
    # always a forward step along the (slowly-turning) direction vector
    # rather than a hop between grid cells, there's no "seen" set and
    # no possibility of backtracking or spiraling — it always makes
    # steady progress toward the boundary, the way a real river
    # crossing a flat plain does.
    x, y = start_xy
    pts = [(x, y)]
    step = max(CELL_DX, CELL_DY) * 0.6
    probe_dirs = [(math.cos(a), math.sin(a)) for a in (i / 16 * 2 * math.pi for i in range(16))]
    # Elevation is normalized 0..1 across the WHOLE map, but a "flat"
    # valley floor still has tiny local wobble from the low-amplitude
    # base noise layer (see the heightfield comment up top) — with too
    # small a threshold that wobble reads as "real" descent on every
    # step, steering the direction a little each time until, over
    # hundreds of steps, it's curved all the way back on itself. Only
    # react to a drop big enough to be actual terrain, not noise.
    DESCENT_EPS = 0.015
    dirx, diry = 0.0, 0.0
    traveled = 0.0
    while traveled < max_dist:
        here_v = fval(x, y)
        best_v, best_dx, best_dy = here_v, 0.0, 0.0
        for pdx, pdy in probe_dirs:
            tx, ty = x + pdx * step, y + pdy * step
            if not (0 <= tx <= W and 0 <= ty <= H):
                continue
            v = fval(tx, ty)
            if v < best_v - DESCENT_EPS:
                best_v, best_dx, best_dy = v, pdx, pdy
        if best_v < here_v - DESCENT_EPS:
            dirx = 0.6 * dirx + 0.4 * best_dx
            diry = 0.6 * diry + 0.4 * best_dy
        elif dirx == 0.0 and diry == 0.0:
            # no descent found and no momentum yet (started on
            # perfectly flat ground) — head for the nearest edge
            dirx = -1.0 if x < W / 2 else 1.0
            diry = -1.0 if y < H / 2 else 1.0
        L = math.hypot(dirx, diry) or 1.0
        x += dirx / L * step
        y += diry / L * step
        traveled += step
        if x <= 0 or x >= W or y <= 0 or y >= H:
            x, y = min(max(x, 0), W), min(max(y, 0), H)
            pts.append((x, y))
            break
        pts.append((x, y))
    return pts

def select_river_starts(pool_size=9, min_sep=200.0, hub_avoid=60.0):
    # Which peak flows the FARTHEST depends on which way its downhill
    # direction happens to point, not just how central the peak is —
    # a central peak can still dump into the nearest edge in a couple
    # hundred units if that's the way the terrain tilts. So rather than
    # guess from position alone, gather a well-separated pool of the
    # highest peaks and let the caller actually trace all of them,
    # keeping whichever ones travel the farthest.
    hub_points = [N[k] for k in HUB_KEYS]
    candidates = [(cx, cy) for cx, cy, r, h in peaks if 0 <= cx <= W and 0 <= cy <= H]
    candidates.sort(key=lambda p: fval(p[0], p[1]), reverse=True)
    chosen = []
    for cx, cy in candidates:
        if any(math.hypot(cx - hx, cy - hy) < hub_avoid for hx, hy in hub_points):
            continue
        if any(math.hypot(cx - sx, cy - sy) < min_sep for sx, sy in chosen):
            continue
        chosen.append((cx, cy))
        if len(chosen) >= pool_size:
            break
    return chosen

def path_length(pts):
    return sum(math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]) for k in range(len(pts) - 1))

_river_starts = select_river_starts()
print(f"river start candidates: {len(_river_starts)}")
_traced = []
for sx, sy in _river_starts:
    pts = trace_river((sx, sy), max_dist=math.hypot(W, H) * 1.3)
    ex, ey = pts[-1]
    reached_edge = ex <= 0.5 or ex >= W - 0.5 or ey <= 0.5 or ey >= H - 0.5
    length = path_length(pts)
    print(f"  start=({sx:.0f},{sy:.0f}) elev={fval(sx,sy):.2f} traced {len(pts)} points, "
          f"length={length:.0f}u ({'reached edge' if reached_edge else 'did not reach edge'})")
    if reached_edge and len(pts) >= 6:
        _traced.append((length, (sx, sy), pts))

# keep the two that actually cover the most ground, well separated
_traced.sort(key=lambda t: t[0], reverse=True)
rivers_raw = []
chosen_starts = []
for length, start, pts in _traced:
    if any(math.hypot(start[0] - sx, start[1] - sy) < 200 for sx, sy in chosen_starts):
        continue
    rivers_raw.append(pts)
    chosen_starts.append(start)
    if len(rivers_raw) >= 2:
        break

rivers_xy = []
for pts in rivers_raw:
    thin = pts[::3] if len(pts) > 24 else pts
    smooth = laplacian_smooth(thin, closed=False, iterations=3, factor=0.6)
    rivers_xy.append(smooth)
    d = catmull_path(smooth)
    # solid blue line, like a real topo sheet's river — a thin darker
    # underlay plus a brighter core reads as water without needing an
    # actual gradient
    parts.append(f'<path d="{d}" stroke="#3d6f9e" stroke-width="4.2" fill="none"/>')
    parts.append(f'<path d="{d}" stroke="#5b9bd5" stroke-width="2.4" fill="none"/>')

print(f"\nrivers: {len(rivers_xy)} traced")

# write contours.svg now that rivers are appended to `parts`
contours_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'fill="none" stroke-linejoin="round" stroke-linecap="round">\n'
                + "\n".join(parts) + "\n</svg>\n")
with io.open(os.path.join(ROOT, "public", "assets", "contours.svg"), "w", encoding="utf-8") as f:
    f.write(contours_svg)
print("contours.svg:", len(contours_svg) // 1024, "KB")

# river-proximity grid cells, used to lightly penalize trails that run
# through or repeatedly cross a river instead of finding a clean ford
def rasterize_near(points_xy, radius):
    cells = set()
    r_gx = max(1, int(radius / W * GW))
    r_gy = max(1, int(radius / H * GH))
    for x, y in points_xy:
        gi, gj = int(x / W * GW), int(y / H * GH)
        for di in range(-r_gx, r_gx + 1):
            for dj in range(-r_gy, r_gy + 1):
                ni, nj = gi + di, gj + dj
                if 0 <= ni <= GW and 0 <= nj <= GH:
                    cells.add((ni, nj))
    return cells

river_cells = set()
for smooth in rivers_xy:
    river_cells |= rasterize_near(smooth, radius=max(CELL_DX, CELL_DY) * 1.1)

# ---------------- terrain-following trails (A* over the heightfield) ----------------
# Real trails avoid sheer slopes — penalize elevation change per unit
# distance far more than distance itself, so paths bend around peaks
# and hug gentler terrain instead of cutting straight through. A light
# extra cost near rivers nudges trails toward a single clean crossing
# rather than running parallel through one or crossing it repeatedly.
STEEPNESS_WEIGHT = 26.0
RIVER_PENALTY = 0.9

def astar(start, goal):
    if start == goal:
        return [start]
    def heuristic(node):
        i, j = node
        gi, gj = goal
        return math.hypot((i - gi) * CELL_DX, (j - gj) * CELL_DY)

    open_heap = [(heuristic(start), 0.0, start)]
    came_from = {}
    best_cost = {start: 0.0}
    closed = set()
    while open_heap:
        _, cost, node = heapq.heappop(open_heap)
        if node in closed:
            continue
        closed.add(node)
        if node == goal:
            break
        i, j = node
        for ni, nj in grid_neighbors8(i, j):
            nxt = (ni, nj)
            if nxt in closed:
                continue
            dist = math.hypot((ni - i) * CELL_DX, (nj - j) * CELL_DY)
            slope = abs(field[ni][nj] - field[i][j]) / dist
            step_cost = dist * (1 + STEEPNESS_WEIGHT * slope)
            if nxt in river_cells:
                step_cost += RIVER_PENALTY * dist
            ncost = cost + step_cost
            if ncost < best_cost.get(nxt, 1e18):
                best_cost[nxt] = ncost
                came_from[nxt] = node
                heapq.heappush(open_heap, (ncost + heuristic(nxt), ncost, nxt))

    if goal not in came_from and goal != start:
        goal = min(best_cost, key=heuristic)  # unreachable (shouldn't happen on a full grid) — best effort
    path, node = [], goal
    while node is not None:
        path.append(node)
        node = came_from.get(node)
    path.reverse()
    return path

def snap_to_grid(pt):
    i = min(max(round(pt[0] / W * GW), 0), GW)
    j = min(max(round(pt[1] / H * GH), 0), GH)
    return (i, j)

def terrain_path(p0, p1, target_points=16):
    path_ij = astar(snap_to_grid(p0), snap_to_grid(p1))
    pts = [(i / GW * W, j / GH * H) for i, j in path_ij]
    if len(pts) < 2:
        return [p0, p1]
    if len(pts) > target_points:
        stride = max(1, len(pts) // target_points)
        pts = pts[::stride]
        if pts[-1] != path_ij[-1]:
            pts.append((path_ij[-1][0] / GW * W, path_ij[-1][1] / GH * H))
    pts[0] = p0
    pts[-1] = p1
    return pts

trails = []
for a, b, kind, cluster in LINKS:
    raw = terrain_path(N[a], N[b])
    smooth = laplacian_smooth(raw, closed=False, iterations=2, factor=0.5) if len(raw) >= 3 else raw
    d = catmull_path(smooth)
    # bold red marked-trail look (topo sheets mark trails in red/tan
    # with tick-mark-like dashes) — primary parent->child routes bolder
    # and closer to solid, secondary lateral links thinner and gappier
    style = (
        {"stroke": "#c0392b", "strokeWidth": 4, "dash": "4 6"} if kind == "p"
        else {"stroke": "#a8402f", "strokeWidth": 2.6, "dash": "3 9"}
    )
    trails.append({"d": d, "cluster": cluster, **style})

js_lines = [
    "// Auto-generated by tools/generate-map.py — do not hand-edit.",
    "// Trail paths for the interactive site map, computed via A* over",
    "// a fractal-noise heightfield (penalizing steep elevation change)",
    "// so they curve around peaks and hug gentler terrain instead of",
    "// cutting straight through (see MapMenu.jsx for render + zoom).",
    "export const mapTrails = [",
]
for t in trails:
    js_lines.append(
        f'  {{ d: "{t["d"]}", cluster: "{t["cluster"]}", '
        f'stroke: "{t["stroke"]}", strokeWidth: {t["strokeWidth"]}, dash: "{t["dash"]}" }},'
    )
js_lines.append("];")

out_path = os.path.join(ROOT, "src", "data", "mapTrails.js")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with io.open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(js_lines) + "\n")
print("mapTrails.js:", len(trails), "trails")
