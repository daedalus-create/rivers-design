"""Rivers Design site-map generator (React version).

One noise heightfield drives everything so it all agrees. The script is
a strict COMPUTE-then-RENDER pipeline: nothing is drawn until every
position, river, and route is final.

    Phase 1  terrain      heightfield + derived slope grid
    Phase 2  summits      hub waypoints land on real peaks
    Phase 3  hydrology    rivers traced downhill from high ground
    Phase 4  waypoints    remaining points placed by "hiking sense"
    Phase 5  framing      per-cluster zoom targets
    Phase 6  routes       terrain-following trails (A* over the field)
    Phase 7  render       SVG + JS emitted, all geometry already known

Phase order is load-bearing. Rivers avoid the hub summits, so hubs come
first (they only need peaks). Waypoint placement avoids the rivers, so
hydrology comes before it. Trails avoid rivers AND connect final
waypoints, so they come last before render.

Outputs:
  - public/assets/contours.svg   organic topo background, incl. rivers
  - src/data/mapTrails.js        trail <path> data
  - src/data/mapGeometry.js      snapped positions + zoom targets

Positions/zoom targets used to be PRINTED for hand-copying into
src/data/mapWaypoints.js, which meant the trails (bent to this script's
coordinates) and the dots (rendered at the hand-copied ones) could
silently drift apart. They're written to mapGeometry.js now and
mapWaypoints.js imports them, so drift is impossible by construction.
mapWaypoints.js stays hand-authored for what humans own — node, href,
cluster, label — and this script READS it to learn each label (needed
for collision math) and cluster (for zoom scale).

Run from anywhere; edit SEED to re-roll the landscape.
"""
import random, math, io, os, re, heapq
from collections import deque

SEED = 7
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

W, H = 1000, 600
GW, GH = 140, 84      # finer grid than before — more, denser contour lines
LEVELS = 26            # real topo sheets read as dense; index line every 5th

# ---------------- palette (grey / white / yellow) ----------------
# Grey ground, white summits, yellow line work. Elevation reads by value
# alone (grey valley floors climbing to white peaks), and yellow carries
# the index contours — every 5th line, the one a real sheet emphasizes —
# so the accent threads the whole map as drawing rather than as landmass.
#
# Water and trails are both dark, and are told apart the way a printed
# sheet does it rather than by hue: water is a solid heavy double line,
# trails are dashed. Rivers sit darker than the trails so that when the
# two cross, the water still reads as continuous underneath.
FILL_LEVELS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]
FILL_COLORS = ["#8c8c8c", "#9a9a9a", "#a9a9a9", "#bababa", "#cfcfcf", "#e7e7e7", "#fcfcfc"]
CONTOUR_MINOR = ("#7c7c7c", "0.7", "0.45")   # (stroke, width, opacity)
CONTOUR_INDEX = ("#e0a92b", "1.6", "0.95")   # yellow index line, every 5th
RIVER_UNDER, RIVER_CORE = "#1d1d1d", "#383838"
RIVER_W_UNDER, RIVER_W_CORE = 5.0, 2.8
TRAIL_PRIMARY = {"stroke": "#333333", "strokeWidth": 4, "dash": "4 6"}
TRAIL_SECONDARY = {"stroke": "#4f4f4f", "strokeWidth": 2.6, "dash": "3 9"}

# ---------------- label collision metrics ----------------
# Waypoint labels are real DOM pills inside the zoomed scene, so their
# on-screen size is (text width) x (zoom scale). Two dots far enough
# apart in canvas units can still collide once their labels are drawn —
# exactly the failure a point-distance check cannot see.
#
# Measured from the live page at a 1280x720 viewport (font-size resolves
# to 16.6px there): widths ran 137px for a 7-character label up to 322px
# for a 23-character one. A linear fit misses by up to 85px because the
# fixed padding dominates short labels, so these constants deliberately
# OVER-estimate every one of the 33 measured labels — over-reserving
# space is safe, under-reserving puts overlapping pills on the page.
REF_VIEWPORT_W, REF_VIEWPORT_H = 1280, 720
LABEL_CHAR_W, LABEL_BASE_W = 13.5, 48.0
LABEL_H_PX = 46.0     # pill height, plus headroom for the "You are here" line

random.seed(SEED)

# ---------------- Phase 1: terrain ----------------
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

CELL_DX, CELL_DY = W / GW, H / GH

def grid_neighbors8(i, j):
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            if di == 0 and dj == 0:
                continue
            ni, nj = i + di, j + dj
            if 0 <= ni <= GW and 0 <= nj <= GH:
                yield ni, nj

# Steepest local grade per cell, in elevation-per-canvas-unit. Placement
# uses this to find genuinely level ground: a hiker pitches camp on the
# flat, and the lowest cell in a basin is often still on a slope.
slope_grid = [[0.0] * (GH + 1) for _ in range(GW + 1)]
for i in range(GW + 1):
    for j in range(GH + 1):
        worst = 0.0
        for ni, nj in grid_neighbors8(i, j):
            d = math.hypot((ni - i) * CELL_DX, (nj - j) * CELL_DY)
            worst = max(worst, abs(field[ni][nj] - field[i][j]) / d)
        slope_grid[i][j] = worst

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

# ---------------- nav graph ----------------
# key -> (x%, y%) — rough layout intent. Placement treats these as a
# WISH, not a coordinate: each is snapped to whatever nearby ground
# actually makes sense to stand on (see Phase 4).
POSITIONS_INTENT = {
    "home": (50, 16),
    "experience": (22, 42),
    "work": (14, 68),
    "sunthru": (5, 81),
    "dreki": (27, 57),
    "work-study": (16, 62),
    "piasecki-steel": (42, 70),
    "resume": (32, 76),
    "education": (24, 92),
    "rpi": (18, 96),
    "classes": (30, 96),
    "projects": (56, 46),
    "completed": (40, 76),
    "pyro-mk7": (18, 66),
    "hephaestus-forge": (52, 66),
    "orbital-maneuver-solver": (35, 55),
    "in-progress": (60, 80),
    "integrated-toolhead": (56, 92),
    "blended-body-aircraft": (68, 90),
    "cm5-cluster": (40, 84),
    "planned": (78, 72),
    "high-speed-motor": (94, 32),
    "electric-thruster": (96, 72),
    "precision-linear-stage": (68, 72),
    "omnidirectional-base": (95, 92),
    "high-temperature-bearing": (80, 78),
    "large-diameter-air-bearing": (78, 92),
    "unpowered-magnetic-bearing": (66, 60),
    "plant-exoskeleton": (76, 38),
    "envisage": (92, 46),
    "land-trust-city": (66, 46),
    "about": (82, 40),
    "contact": (87, 68),
}
HUB_KEYS = {"home", "experience", "projects", "about"}
PARENT_OF = {
    "pyro-mk7": "completed", "hephaestus-forge": "completed", "orbital-maneuver-solver": "completed",
    "integrated-toolhead": "in-progress", "blended-body-aircraft": "in-progress",
    "cm5-cluster": "in-progress",
    "high-speed-motor": "planned", "electric-thruster": "planned",
    "precision-linear-stage": "planned", "omnidirectional-base": "planned",
    "high-temperature-bearing": "planned", "large-diameter-air-bearing": "planned",
    "unpowered-magnetic-bearing": "planned", "plant-exoskeleton": "planned",
    "envisage": "planned", "land-trust-city": "planned",
    "sunthru": "work", "dreki": "work", "work-study": "work", "piasecki-steel": "work",
    "rpi": "education", "classes": "education",
}
LEAF_KEYS = set(PARENT_OF)

ZOOM_GROUPS = {
    "experience": ["work", "resume", "education"],
    "projects": ["completed", "in-progress", "planned"],
    "about": ["contact"],
    "completed": ["pyro-mk7", "hephaestus-forge", "orbital-maneuver-solver"],
    "in-progress": ["integrated-toolhead", "blended-body-aircraft", "cm5-cluster"],
    "planned": [
        "high-speed-motor", "electric-thruster", "precision-linear-stage",
        "omnidirectional-base", "high-temperature-bearing", "large-diameter-air-bearing",
        "unpowered-magnetic-bearing", "plant-exoskeleton", "envisage",
        "land-trust-city",
    ],
    "work": ["sunthru", "dreki", "work-study", "piasecki-steel"],
    "education": ["rpi", "classes"],
}

# (from, to, kind, cluster) — cluster "hub" always visible; others only
# visible while their cluster is the active zoom. Parent->child links
# use the child's own cluster; sibling ("s") links use the shared
# parent cluster.
LINKS = [
    ("home", "experience", "p", "hub"), ("home", "projects", "p", "hub"), ("home", "about", "p", "hub"),
    ("experience", "work", "p", "experience"), ("experience", "resume", "p", "experience"),
    ("experience", "education", "p", "experience"),
    ("projects", "completed", "p", "projects"), ("projects", "in-progress", "p", "projects"),
    ("projects", "planned", "p", "projects"),
    ("about", "contact", "p", "about"),
    ("experience", "projects", "s", "hub"), ("projects", "about", "s", "hub"),
    ("work", "resume", "s", "experience"), ("resume", "education", "s", "experience"),
    ("completed", "in-progress", "s", "projects"), ("in-progress", "planned", "s", "projects"),
    ("completed", "pyro-mk7", "p", "completed"), ("completed", "hephaestus-forge", "p", "completed"),
    ("completed", "orbital-maneuver-solver", "p", "completed"),
    ("in-progress", "integrated-toolhead", "p", "in-progress"),
    ("in-progress", "blended-body-aircraft", "p", "in-progress"),
    ("in-progress", "cm5-cluster", "p", "in-progress"),
    ("planned", "high-speed-motor", "p", "planned"),
    ("planned", "electric-thruster", "p", "planned"),
    ("planned", "precision-linear-stage", "p", "planned"),
    ("planned", "omnidirectional-base", "p", "planned"),
    ("planned", "high-temperature-bearing", "p", "planned"),
    ("planned", "large-diameter-air-bearing", "p", "planned"),
    ("planned", "unpowered-magnetic-bearing", "p", "planned"),
    ("planned", "plant-exoskeleton", "p", "planned"),
    ("planned", "envisage", "p", "planned"),
    ("planned", "land-trust-city", "p", "planned"),
    ("work", "sunthru", "p", "work"), ("work", "dreki", "p", "work"), ("work", "work-study", "p", "work"),
    ("work", "piasecki-steel", "p", "work"),
    ("education", "rpi", "p", "education"), ("education", "classes", "p", "education"),
    ("pyro-mk7", "hephaestus-forge", "s", "completed"),
    ("hephaestus-forge", "orbital-maneuver-solver", "s", "completed"),
    ("cm5-cluster", "integrated-toolhead", "s", "in-progress"),
    ("integrated-toolhead", "blended-body-aircraft", "s", "in-progress"),
    # No sibling chain for "planned": with ten leaves the ten parent
    # trails already read as a trail network, and a nine-link chain
    # threading all of them turns it into a hairball.
    ("sunthru", "dreki", "s", "work"), ("dreki", "work-study", "s", "work"),
    ("work-study", "piasecki-steel", "s", "work"),
    ("rpi", "classes", "s", "education"),
]

# Labels and clusters are hand-authored in mapWaypoints.js — read them
# from there so there is one source of truth. Labels drive the collision
# math; clusters decide which zoom scale a pair is judged at.
WAYPOINTS_JS = os.path.join(ROOT, "src", "data", "mapWaypoints.js")
LABEL_OF, CLUSTER_OF = {}, {}
_nav_src = io.open(WAYPOINTS_JS, encoding="utf-8").read()
for _m in re.finditer(
    r'\{\s*node:\s*"([^"]+)"[^}]*?cluster:\s*"([^"]+)"[^}]*?label:\s*"([^"]+)"', _nav_src
):
    LABEL_OF[_m.group(1)] = _m.group(3)
    CLUSTER_OF[_m.group(1)] = _m.group(2)
_missing = sorted(set(POSITIONS_INTENT) - set(LABEL_OF))
if _missing:
    raise SystemExit(
        f"No waypoint in src/data/mapWaypoints.js for: {_missing}\n"
        "Add the nav entry (node/href/cluster/label) there first — this "
        "script needs its label to reserve space for the rendered pill."
    )
_orphans = sorted(set(LABEL_OF) - set(POSITIONS_INTENT))
if _orphans:
    raise SystemExit(
        f"No POSITIONS_INTENT entry here for: {_orphans}\n"
        "Add a rough (x%, y%) intent so they can be placed."
    )

ZOOM_SCALES = {}   # filled in Phase 5, fed back into Phase 4 next pass

def label_w_px(node):
    return LABEL_CHAR_W * len(LABEL_OF[node]) + LABEL_BASE_W

def labels_clash(node_a, xy_a, node_b, xy_b, scale):
    """True if two labels' pills would overlap on screen at `scale`.

    Pills are centered under their dot, so both carry the same vertical
    offset and comparing dot positions against pill dimensions is valid.
    """
    px_per_x = REF_VIEWPORT_W * scale / W
    px_per_y = REF_VIEWPORT_H * scale / H
    need_x = (label_w_px(node_a) / 2 + label_w_px(node_b) / 2) / px_per_x
    need_y = LABEL_H_PX / px_per_y
    return abs(xy_a[0] - xy_b[0]) < need_x and abs(xy_a[1] - xy_b[1]) < need_y

# ---------------- Phases 2 & 4: waypoint placement ----------------
MIN_PARENT_SEP = 60.0     # canvas units — cramped nav points are hard to click
SNAP_RADIUS = 95.0        # hubs: keep the snap near the intended spot
LEAF_SEARCH_SCHEDULE = [40.0, 65.0, 95.0, 135.0, 185.0]
EDGE_MARGIN = 15.0

# "Hiking sense" weights. A spot worth marking on a walking map is low,
# level, and near water without being in it — and reachable from its
# parent without scrambling up a face. Each term is normalized to 0..1
# before weighting, so these read as relative priorities.
W_ELEV = 1.00            # prefer valley floors over shoulders
W_SLOPE = 1.60           # prefer level ground — the strongest single signal
W_APPROACH = 0.90        # prefer an easy walk in from the parent
W_INTENT = 0.55          # stay near the hand-authored layout intent
W_WATER = 0.45           # mild pull toward a river (water is why trails go there)
IN_RIVER_PENALTY = 4.0   # but never ON the river
WATER_NEAR = 90.0        # units within which "near water" counts
SLOPE_NORM = 0.02        # grade treated as "as steep as it matters"

def nearest_peak_center(x0, y0):
    best, best_d2 = (x0, y0), 1e18
    for cx, cy, r, h in peaks:
        d2 = (cx - x0) ** 2 + (cy - y0) ** 2
        if d2 < best_d2:
            best_d2, best = d2, (cx, cy)
    return best

def local_extremum(x0, y0, radius, seek_max):
    gx0, gy0 = x0 / W * GW, y0 / H * GH
    gr_x, gr_y = radius / W * GW, radius / H * GH
    i0, i1 = max(0, int(gx0 - gr_x)), min(GW, int(gx0 + gr_x))
    j0, j1 = max(0, int(gy0 - gr_y)), min(GH, int(gy0 + gr_y))
    best_v, best_xy = (-1e18 if seek_max else 1e18), (x0, y0)
    for i in range(i0, i1 + 1):
        for j in range(j0, j1 + 1):
            v = field[i][j]
            if (v > best_v) if seek_max else (v < best_v):
                best_v, best_xy = v, (i / GW * W, j / GH * H)
    return best_xy

def clamp_xy(sx, sy):
    return (min(max(sx, EDGE_MARGIN), W - EDGE_MARGIN),
            min(max(sy, EDGE_MARGIN), H - EDGE_MARGIN))

def approach_grade(p_from, p_to, samples=12):
    """Mean absolute grade along the straight line between two points.

    A cheap stand-in for "can you walk it": a high value means the
    direct line crosses a face, so the spot is awkward to reach from its
    parent even if the ground there is pleasant.
    """
    seg = math.hypot(p_to[0] - p_from[0], p_to[1] - p_from[1]) / samples or 1.0
    total, prev = 0.0, fval(*p_from)
    for s in range(1, samples + 1):
        t = s / samples
        v = fval(p_from[0] + (p_to[0] - p_from[0]) * t,
                 p_from[1] + (p_to[1] - p_from[1]) * t)
        total += abs(v - prev) / seg
        prev = v
    return total / samples

def place_hubs():
    """Phase 2 — hubs sit on real summits: the landmarks you navigate by."""
    out = {}
    for key in POSITIONS_INTENT:
        if key not in HUB_KEYS:
            continue
        x, y = POSITIONS_INTENT[key]
        x0, y0 = x / 100 * W, y / 100 * H
        sx, sy = nearest_peak_center(x0, y0)
        # a hub can end up far from a sparse peak — don't wander past the
        # search radius, just settle for the steepest nearby spot
        if math.hypot(sx - x0, sy - y0) > SNAP_RADIUS * 1.6:
            sx, sy = local_extremum(x0, y0, SNAP_RADIUS * 1.6, seek_max=True)
        out[key] = clamp_xy(sx, sy)
    return out

def place_rest(hub_xy, river_dist, report):
    """Phase 4 — everything that isn't a hub, by hiking sense.

    Auto-resolving: candidates are scored, then the best one satisfying
    every hard constraint (parent separation, no label clash with an
    already-placed sibling, cell not already claimed) wins. If a search
    radius yields nothing legal it widens; only if every radius fails
    does a constraint get relaxed, and that is reported, never silent.
    """
    placed = dict(hub_xy)
    claimed = set()

    def claim(sx, sy, radius=25.0):
        gi0, gi1 = int((sx - radius) / W * GW), int((sx + radius) / W * GW)
        gj0, gj1 = int((sy - radius) / H * GH), int((sy + radius) / H * GH)
        for i in range(max(0, gi0), min(GW, gi1) + 1):
            for j in range(max(0, gj0), min(GH, gj1) + 1):
                claimed.add((i, j))

    for xy in hub_xy.values():
        claim(*xy)

    # parents before children, so a child can measure against its parent
    intent_order = list(POSITIONS_INTENT)
    order = sorted(
        (k for k in POSITIONS_INTENT if k not in HUB_KEYS),
        key=lambda k: (1 if k in LEAF_KEYS else 0, intent_order.index(k)),
    )

    for key in order:
        ix, iy = POSITIONS_INTENT[key]
        x0, y0 = ix / 100 * W, iy / 100 * H
        parent_xy = placed.get(PARENT_OF.get(key))
        cluster = CLUSTER_OF[key]
        scale = ZOOM_SCALES.get(cluster, 1.0)
        siblings = [n for n in placed if CLUSTER_OF.get(n) == cluster]
        radii = LEAF_SEARCH_SCHEDULE if key in LEAF_KEYS else [SNAP_RADIUS]

        chosen, relaxed = None, []
        for relax in (0, 1, 2):
            for radius in radii:
                gr_x, gr_y = radius / W * GW, radius / H * GH
                ci, cj = x0 / W * GW, y0 / H * GH
                i0, i1 = max(0, int(ci - gr_x)), min(GW, int(ci + gr_x))
                j0, j1 = max(0, int(cj - gr_y)), min(GH, int(cj + gr_y))
                cands = []
                for i in range(i0, i1 + 1):
                    for j in range(j0, j1 + 1):
                        if relax < 2 and (i, j) in claimed:
                            continue
                        cx, cy = clamp_xy(i / GW * W, j / GH * H)
                        d_intent = math.hypot(cx - x0, cy - y0)
                        if d_intent > radius:
                            continue
                        rd = river_dist[i][j]
                        cost = (
                            W_ELEV * field[i][j]
                            + W_SLOPE * min(1.0, slope_grid[i][j] / SLOPE_NORM)
                            + W_INTENT * (d_intent / max(radius, 1.0))
                            + (IN_RIVER_PENALTY if rd <= max(CELL_DX, CELL_DY) else 0.0)
                            - W_WATER * max(0.0, 1.0 - rd / WATER_NEAR)
                        )
                        if parent_xy:
                            cost += W_APPROACH * min(
                                1.0, approach_grade(parent_xy, (cx, cy)) / SLOPE_NORM
                            )
                        cands.append((cost, cx, cy))
                cands.sort()
                for _cost, cx, cy in cands:
                    if relax < 1 and parent_xy and math.hypot(
                        cx - parent_xy[0], cy - parent_xy[1]
                    ) < MIN_PARENT_SEP:
                        continue
                    if relax < 1 and any(
                        labels_clash(key, (cx, cy), s, placed[s], scale) for s in siblings
                    ):
                        continue
                    chosen = (cx, cy)
                    break
                if chosen:
                    break
            if chosen:
                if relax == 1:
                    relaxed.append("parent separation / label clearance")
                elif relax == 2:
                    relaxed.append("claimed-cell exclusivity")
                break

        if not chosen:
            # every radius at every relaxation failed — shouldn't happen
            # on a full grid, but never place nothing
            chosen = clamp_xy(x0, y0)
            relaxed.append("fell back to raw intent")

        placed[key] = chosen
        claim(*chosen)
        if relaxed:
            report.append(f"  {key:26s} relaxed: {', '.join(relaxed)}")

    return placed

# ---------------- Phase 3: hydrology ----------------
def trace_river(start_xy, max_dist):
    # Real valley floors are mostly flat, so a discrete grid-hop
    # steepest-descent walk stalls constantly once the ground levels off,
    # and picking "whichever unvisited neighbor is lowest" to push
    # through a stall wanders across a flat basin. Trace in continuous
    # space instead: probe a ring of directions for the steepest nearby
    # drop and steer the running flow direction toward it; if nothing
    # nearby is downhill, coast in the established direction. Motion is
    # always a forward step along a slowly-turning vector rather than a
    # hop between cells, so there is no backtracking or spiraling — it
    # makes steady progress toward the boundary, the way a real river
    # crossing a flat plain does.
    x, y = start_xy
    pts = [(x, y)]
    step = max(CELL_DX, CELL_DY) * 0.6
    probe_dirs = [(math.cos(a), math.sin(a)) for a in (i / 16 * 2 * math.pi for i in range(16))]
    # Elevation is normalized across the WHOLE map, but a "flat" valley
    # floor still wobbles slightly from the base noise layer — too small
    # a threshold reads that wobble as real descent every step, curving
    # the path until it doubles back. Only react to a drop big enough to
    # be actual terrain.
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

def path_length(pts):
    return sum(math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1])
               for k in range(len(pts) - 1))

def trace_rivers(hub_xy, want=3, pool_size=10, min_sep=200.0, hub_avoid=60.0):
    """Trace from the highest well-separated peaks, keep the longest.

    Which headwater flows FARTHEST depends on which way the terrain
    tilts under it, not just how central it is, so gather a pool of high
    peaks and actually trace them all rather than guessing from position.
    """
    hub_points = list(hub_xy.values())
    candidates = [(cx, cy) for cx, cy, r, h in peaks if 0 <= cx <= W and 0 <= cy <= H]
    candidates.sort(key=lambda p: fval(p[0], p[1]), reverse=True)
    starts = []
    for cx, cy in candidates:
        if any(math.hypot(cx - hx, cy - hy) < hub_avoid for hx, hy in hub_points):
            continue
        if any(math.hypot(cx - sx, cy - sy) < min_sep for sx, sy in starts):
            continue
        starts.append((cx, cy))
        if len(starts) >= pool_size:
            break

    traced = []
    for sx, sy in starts:
        pts = trace_river((sx, sy), max_dist=math.hypot(W, H) * 1.3)
        ex, ey = pts[-1]
        if (ex <= 0.5 or ex >= W - 0.5 or ey <= 0.5 or ey >= H - 0.5) and len(pts) >= 6:
            traced.append((path_length(pts), (sx, sy), pts))

    traced.sort(key=lambda t: t[0], reverse=True)
    kept, kept_starts = [], []
    for _length, start, pts in traced:
        if any(math.hypot(start[0] - sx, start[1] - sy) < min_sep for sx, sy in kept_starts):
            continue
        thin = pts[::3] if len(pts) > 24 else pts
        kept.append(laplacian_smooth(thin, closed=False, iterations=3, factor=0.6))
        kept_starts.append(start)
        if len(kept) >= want:
            break
    return kept, len(starts), len(traced)

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

def river_distance_grid(river_cells):
    """Approx distance (canvas units) from each cell to the nearest river.

    Multi-source BFS in cell hops scaled by mean cell size — plenty
    accurate for "is this near water" scoring, far cheaper than an exact
    distance transform.
    """
    dist = [[float("inf")] * (GH + 1) for _ in range(GW + 1)]
    q = deque()
    for i, j in river_cells:
        dist[i][j] = 0.0
        q.append((i, j))
    hop = (CELL_DX + CELL_DY) / 2
    while q:
        i, j = q.popleft()
        for ni, nj in grid_neighbors8(i, j):
            if dist[ni][nj] > dist[i][j] + hop:
                dist[ni][nj] = dist[i][j] + hop
                q.append((ni, nj))
    return dist

# ---------------- Phase 5: framing ----------------
def zoom_target_for(positions, member_keys, pad=0.09, max_scale=3.2, min_scale=1.15):
    xs = [positions[k][0] / W for k in member_keys]
    ys = [positions[k][1] / H for k in member_keys]
    raw_minx, raw_maxx = min(xs), max(xs)
    raw_miny, raw_maxy = min(ys), max(ys)
    # padded box drives the initial "nicely framed" scale guess only —
    # clip it to the canvas, since padding past the edge would demand
    # showing background that doesn't exist out there
    minx, maxx = max(0.0, raw_minx - pad), min(1.0, raw_maxx + pad)
    miny, maxy = max(0.0, raw_miny - pad), min(1.0, raw_maxy + pad)
    # scale is a single scalar applied to both axes (see MapMenu.jsx
    # applyZoom) — constrain by whichever span is LARGER, not smaller.
    # Members sharing a near-identical x or y would otherwise collapse
    # that axis's span to ~0 and force an absurd zoom from coincidence.
    span = max(maxx - minx, maxy - miny, 0.01)
    scale = min(1 / span, max_scale)

    # Two constraints must hold at once: (a) the scaled scene must fully
    # cover the viewport — a center too close to 0/1 exposes blank space
    # past its edge — and (b) every member must land INSIDE the visible
    # viewport. Solve both: at a given scale the viewport can be centered
    # anywhere in [members-visible] AND [background-safe]; if those
    # overlap take the middle, else back the scale off and retry.
    # Visibility uses the RAW extent — padding is breathing room, not a
    # hard requirement.
    def overlap(raw_lo, raw_hi, s):
        margin = 0.5 / s
        vis_lo, vis_hi = raw_hi - margin, raw_lo + margin
        safe_lo, safe_hi = margin, 1 - margin
        ov_lo, ov_hi = max(vis_lo, safe_lo), min(vis_hi, safe_hi)
        return (ov_lo, ov_hi) if ov_lo <= ov_hi else None

    while scale > min_scale:
        ox, oy = overlap(raw_minx, raw_maxx, scale), overlap(raw_miny, raw_maxy, scale)
        if ox and oy:
            fx, fy = (ox[0] + ox[1]) / 2, (oy[0] + oy[1]) / 2
            return {"fx": round(fx, 3), "fy": round(fy, 3), "scale": round(scale, 2)}
        scale *= 0.92
    # backed off to min_scale without satisfying both (members span more
    # than the viewport even there) — center on the raw extent and let
    # the background-safe clamp win, same as MapMenu.jsx's runtime clamp
    scale = max(scale, min_scale)
    margin = 0.5 / scale
    fx = min(max((raw_minx + raw_maxx) / 2, margin), 1 - margin)
    fy = min(max((raw_miny + raw_maxy) / 2, margin), 1 - margin)
    return {"fx": round(fx, 3), "fy": round(fy, 3), "scale": round(scale, 2)}

# ================= run the pipeline =================
print(f"Phase 1  terrain      {NUM_PEAKS} peaks on a {GW}x{GH} grid, seed {SEED}")

hub_xy = place_hubs()
print(f"Phase 2  summits      {len(hub_xy)} hubs snapped to peaks")

rivers_xy, pool_n, traced_n = trace_rivers(hub_xy)
river_cells = set()
for _r in rivers_xy:
    river_cells |= rasterize_near(_r, radius=max(CELL_DX, CELL_DY) * 1.1)
river_dist = river_distance_grid(river_cells)
print(f"Phase 3  hydrology    {len(rivers_xy)} rivers kept "
      f"({traced_n} of {pool_n} candidate headwaters reached an edge)")

# Placement needs each cluster's zoom scale to judge label overlap, but
# the scale is derived from the placement — so iterate until the scales
# stop moving. Two passes is normally enough; the loop caps at four.
POSITIONS, ZOOM_TARGETS, placement_report = {}, {}, []
for pass_i in range(4):
    placement_report = []
    POSITIONS = place_rest(hub_xy, river_dist, placement_report)
    ZOOM_TARGETS = {n: zoom_target_for(POSITIONS, m) for n, m in ZOOM_GROUPS.items()}
    new_scales = {n: t["scale"] for n, t in ZOOM_TARGETS.items()}
    if new_scales == ZOOM_SCALES:
        print(f"Phase 4  waypoints    {len(POSITIONS)} placed; "
              f"zoom scales converged after {pass_i} refinement pass(es)")
        break
    ZOOM_SCALES = new_scales
else:
    print(f"Phase 4  waypoints    {len(POSITIONS)} placed; "
          "zoom scales still moving after 4 passes (using last)")
for _line in placement_report:
    print(_line)
print(f"Phase 5  framing      {len(ZOOM_TARGETS)} zoom targets")

# Verify what actually matters: no two SIMULTANEOUSLY-VISIBLE labels
# overlap. Hubs are judged at scale 1 (the un-zoomed map); cluster
# members at their own cluster's scale.
clashes = []
check_groups = [("hub", 1.0, [k for k in POSITIONS if CLUSTER_OF[k] == "hub"])]
for _node, _members in ZOOM_GROUPS.items():
    check_groups.append((_node, ZOOM_TARGETS[_node]["scale"], _members))
for _g, _s, _members in check_groups:
    for _i, _a in enumerate(_members):
        for _b in _members[_i + 1:]:
            if labels_clash(_a, POSITIONS[_a], _b, POSITIONS[_b], _s):
                clashes.append(f"  !! {_g}: {_a} / {_b} labels overlap at scale {_s}")
print(f"         label check  {'no overlaps' if not clashes else f'{len(clashes)} OVERLAPS'}")
for _c in clashes:
    print(_c)

# ---------------- Phase 6: routes ----------------
# Real trails avoid sheer slopes — penalize elevation change per unit
# distance far more than distance itself, so paths bend around peaks and
# hug gentler terrain. A light extra cost near rivers nudges trails
# toward a single clean ford rather than running parallel through one.
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
    came_from, best_cost, closed = {}, {start: 0.0}, set()
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
        goal = min(best_cost, key=heuristic)  # unreachable on a full grid — best effort
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
        tail = (path_ij[-1][0] / GW * W, path_ij[-1][1] / GH * H)
        pts = pts[::stride]
        if pts[-1] != tail:
            pts.append(tail)
    pts[0] = p0
    pts[-1] = p1
    return pts

trails = []
for _a, _b, _kind, _cluster in LINKS:
    raw = terrain_path(POSITIONS[_a], POSITIONS[_b])
    smooth = laplacian_smooth(raw, closed=False, iterations=2, factor=0.5) if len(raw) >= 3 else raw
    # Dashed charcoal marked-trail look — dashes (not hue) are what
    # separate a trail from a river, so trails stay legible where they
    # ford one. Primary parent->child routes bolder and closer to solid,
    # secondary lateral links thinner and gappier.
    style = TRAIL_PRIMARY if _kind == "p" else TRAIL_SECONDARY
    trails.append({"d": catmull_path(smooth), "cluster": _cluster, **style})
print(f"Phase 6  routes       {len(trails)} trails over {len(LINKS)} links")

# ---------------- Phase 7: render ----------------
# Nothing above drew anything. All geometry is final, so the SVG is
# assembled in one pass, bottom layer first.
parts = [f'<rect x="0" y="0" width="{W}" height="{H}" fill="{FILL_COLORS[0]}"/>']

# Hypsometric bands. Painter's algorithm: start with a full-canvas rect
# in the lowest band's color, then for each threshold (ascending) fill
# just the CLOSED marching-squares loops (peaks/basins that don't touch
# the canvas edge — open, edge-crossing loops are skipped since closing
# them correctly means following the canvas boundary) with the next
# band's color. Successive thresholds' closed regions nest inside the
# previous one, so layering low-to-high produces correct-looking bands
# without ever computing an isoband polygon.
for _lvl_i, _iso in enumerate(FILL_LEVELS):
    ds = []
    for line, closed in chain(segments_for(_iso)):
        if not closed or len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        ds.append(catmull_path(laplacian_smooth(thin, True, 3, 0.6), closed=True))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" fill="{FILL_COLORS[_lvl_i + 1]}" fill-rule="evenodd"/>')

# Contour lines — every 5th bolder, the way a real sheet marks index
# lines. Grey on grey: elevation is carried by the fill value, so the
# lines only have to describe shape.
for _li in range(1, LEVELS + 1):
    _iso = _li / (LEVELS + 1)
    stroke, width, opacity = CONTOUR_INDEX if _li % 5 == 0 else CONTOUR_MINOR
    ds = []
    for line, closed in chain(segments_for(_iso)):
        if len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        ds.append(catmull_path(laplacian_smooth(thin, closed, 3, 0.6), closed=closed))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" stroke="{stroke}" '
                     f'stroke-width="{width}" opacity="{opacity}"/>')

# Rivers last so they sit above the contours, as on a printed sheet. A
# darker underlay plus a lighter core reads as water without a gradient,
# and being the darkest ink on the map it stays legible against every
# hypsometric band.
for _smooth in rivers_xy:
    d = catmull_path(_smooth)
    parts.append(f'<path d="{d}" stroke="{RIVER_UNDER}" stroke-width="{RIVER_W_UNDER}" fill="none"/>')
    parts.append(f'<path d="{d}" stroke="{RIVER_CORE}" stroke-width="{RIVER_W_CORE}" fill="none"/>')

contours_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'fill="none" stroke-linejoin="round" stroke-linecap="round">\n'
                + "\n".join(parts) + "\n</svg>\n")
with io.open(os.path.join(ROOT, "public", "assets", "contours.svg"), "w",
              encoding="utf-8", newline="\n") as f:
    f.write(contours_svg)

trail_lines = [
    "// Auto-generated by tools/generate-map.py — do not hand-edit.",
    "// Trail paths for the interactive site map, computed via A* over a",
    "// fractal-noise heightfield (penalizing steep elevation change and",
    "// river crossings) so they curve around peaks and hug gentler",
    "// terrain instead of cutting straight through.",
    "export const mapTrails = [",
]
for t in trails:
    trail_lines.append(
        f'  {{ d: "{t["d"]}", cluster: "{t["cluster"]}", '
        f'stroke: "{t["stroke"]}", strokeWidth: {t["strokeWidth"]}, dash: "{t["dash"]}" }},'
    )
trail_lines.append("];")
trails_path = os.path.join(ROOT, "src", "data", "mapTrails.js")
os.makedirs(os.path.dirname(trails_path), exist_ok=True)
with io.open(trails_path, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(trail_lines) + "\n")

geom_lines = [
    "// Auto-generated by tools/generate-map.py — do not hand-edit.",
    "//",
    "// Waypoint positions (x%, y%) snapped onto real terrain features,",
    "// plus the per-cluster zoom framing derived from them. These live",
    "// here rather than in mapWaypoints.js so the dots and the trails",
    "// (bent to these same coordinates) can never drift apart — run",
    "// `npm run generate-map` to regenerate both together.",
    "export const mapPositions = {",
]
for _k, (_x, _y) in POSITIONS.items():
    geom_lines.append(f'  "{_k}": [{round(_x / W * 100, 1)}, {round(_y / H * 100, 1)}],')
geom_lines += ["};", "", "export const zoomTargets = {"]
for _k, _t in ZOOM_TARGETS.items():
    geom_lines.append(f'  "{_k}": {{ fx: {_t["fx"]}, fy: {_t["fy"]}, scale: {_t["scale"]} }},')
geom_lines.append("};")
with io.open(os.path.join(ROOT, "src", "data", "mapGeometry.js"), "w",
              encoding="utf-8", newline="\n") as f:
    f.write("\n".join(geom_lines) + "\n")

print(f"Phase 7  render       contours.svg {len(contours_svg) // 1024} KB, "
      f"mapTrails.js {len(trails)} trails, mapGeometry.js {len(POSITIONS)} positions")
if clashes:
    raise SystemExit(f"\n{len(clashes)} label overlap(s) remain — see above.")
