"""Rivers Design site-map generator (React version).

One noise heightfield drives everything so it all agrees:
  - public/assets/contours.svg   organic topo background
  - src/data/mapTrails.js        terrain-following trail <path> data,
                                  consumed by src/components/MapMenu.jsx

Waypoint positions/labels/hrefs live by hand in
src/data/mapWaypoints.js (small, hand-authored, tightly coupled to
React Router paths) — this script only owns the generated geometry.

Run from anywhere; edit SEED to re-roll the landscape.
"""
import random, math, io, os

SEED = 7
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

W, H = 1000, 600
GW, GH = 110, 66      # coarser grid + smoothing below = softer, organic lines
LEVELS = 15

random.seed(SEED)

# ---------------- heightfield ----------------
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

octaves = [(make_lattice(6, 5), 1.0), (make_lattice(12, 9), 0.55),
           (make_lattice(24, 17), 0.28), (make_lattice(48, 33), 0.12)]

field = [[0.0] * (GH + 1) for _ in range(GW + 1)]
lo, hi = 1e9, -1e9
for i in range(GW + 1):
    for j in range(GH + 1):
        v = 0.0
        for lat, amp in octaves:
            n, m = len(lat), len(lat[0])
            v += amp * sample(lat, i / (GW + 1) * (n - 1) * 1.6, j / (GH + 1) * (m - 1) * 1.6)
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

def key(p):
    return (round(p[0], 1), round(p[1], 1))

def chain(segs):
    adj = {}
    for s in segs:
        a, b = key(s[0]), key(s[1])
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

parts = []
for li in range(1, LEVELS + 1):
    iso = li / (LEVELS + 1)
    index_line = (li % 4 == 0)
    stroke = "#2a2a2a" if index_line else "#252525"
    width = "1.4" if index_line else "1"
    ds = []
    for line, closed in chain(segments_for(iso)):
        if len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        smooth = laplacian_smooth(thin, closed, iterations=3, factor=0.6)
        ds.append(catmull_path(smooth, closed=closed))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" stroke="{stroke}" stroke-width="{width}"/>')

contours_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'fill="none" stroke-linejoin="round" stroke-linecap="round">\n'
                + "\n".join(parts) + "\n</svg>\n")
with io.open(os.path.join(ROOT, "public", "assets", "contours.svg"), "w", encoding="utf-8") as f:
    f.write(contours_svg)
print("contours.svg:", len(contours_svg) // 1024, "KB")

# ---------------- waypoint positions (must match src/data/mapWaypoints.js) ----------------
# key -> (x%, y%)  — kept in sync by hand with mapWaypoints.js
POSITIONS = {
    "home": (50, 16),
    "experience": (22, 42),
    "work": (14, 68),
    "resume": (32, 76),
    "projects": (56, 46),
    "completed": (44, 74),
    "working": (68, 74),
    "about": (82, 40),
    "contact": (87, 68),
}
N = {k: (x / 100 * W, y / 100 * H) for k, (x, y) in POSITIONS.items()}

# (from, to, kind, cluster) — cluster "hub" always visible; others only
# visible while their cluster is the active zoom. "pages"/"plans" leaf
# nodes were dropped now that Completed / Still Working link straight
# to real list pages (see App.jsx routes) instead of anchors.
LINKS = [
    ("home", "experience", "p", "hub"), ("home", "projects", "p", "hub"), ("home", "about", "p", "hub"),
    ("experience", "work", "p", "experience"), ("experience", "resume", "p", "experience"),
    ("projects", "completed", "p", "projects"), ("projects", "working", "p", "projects"),
    ("about", "contact", "p", "about"),
    ("experience", "projects", "s", "hub"), ("projects", "about", "s", "hub"),
    ("work", "resume", "s", "experience"), ("completed", "working", "s", "projects"),
]

def trail_points(p0, p1, k=120, n=16):
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy) or 1
    px, py = -dy / L, dx / L
    pts = []
    for s in range(n + 1):
        t = s / n
        x, y = p0[0] + dx * t, p0[1] + dy * t
        off = (fval(x, y) - 0.5) * k * math.sin(math.pi * t)
        pts.append((x + px * off, y + py * off))
    return pts

trails = []
for a, b, kind, cluster in LINKS:
    d = catmull_path(trail_points(N[a], N[b]))
    style = (
        {"stroke": "#5a5a5a", "strokeWidth": 2, "dash": "2 9"} if kind == "p"
        else {"stroke": "#454545", "strokeWidth": 1.5, "dash": "1 8"}
    )
    trails.append({"d": d, "cluster": cluster, **style})

js_lines = [
    "// Auto-generated by tools/generate-map.py — do not hand-edit.",
    "// Trail paths for the interactive site map, computed from a",
    "// fractal-noise heightfield so they bend with the terrain",
    "// (see MapMenu.jsx for how these render + zoom).",
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
