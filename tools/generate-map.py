"""Generates the topographic backdrop behind the site.

This used to drive an interactive site map: it placed waypoints on the
terrain, traced rivers, routed A* trails between pages, and solved zoom
framing for a click-to-explore overlay. The branching menu replaced all
of that, so what is left is the one thing still wanted — a quiet contour
drawing to sit behind the page.

Accordingly it does exactly three things: build a heightfield, trace
contour lines through it, and write them out. Every line is the same
grey and the same weight; there are no index lines, no elevation tints,
no rivers, and no labels. The backdrop is meant to be felt rather than
read, so its opacity is set in CSS (see .page-backdrop in global.css)
rather than baked in here.

Output:
  - public/assets/contours.svg

Run from anywhere; edit SEED to re-roll the landscape.
"""
import random, math, io, os

SEED = 7
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

W, H = 1000, 600
GW, GH = 140, 84      # grid resolution; finer means denser, finer lines
LEVELS = 26            # number of contour intervals

# One grey for every line, by design. Kept dark and thin: the drawing
# sits behind the page, and anything brighter or heavier competes with
# the text for attention instead of receding behind it.
STROKE = "#454545"
STROKE_W = "0.55"

random.seed(SEED)

# ---------------- heightfield ----------------
# Real topo sheets aren't uniform noise — they're a handful of actual
# peaks (contours packed tight on the flanks) sitting in mostly flat,
# sparse valleys. Model that directly: a sum of localized Gaussian
# "peaks" at random points, sizes, and heights, so line DENSITY carries
# the sense of elevation the way it does on a real map, plus a faint
# broad undulation underneath so the valleys aren't a dead flat zero.
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
    peaks.append((
        random.uniform(-60, W + 60),
        random.uniform(-60, H + 60),
        random.uniform(65, 230),
        random.uniform(0.4, 1.0),
    ))

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

# ---------------- smoothing ----------------
def laplacian_smooth(pts, closed, iterations=3, factor=0.6):
    pts = list(pts)
    n = len(pts)
    if n < 3:
        return pts
    for _ in range(iterations):
        out = list(pts)
        rng = range(n) if closed else range(1, n - 1)
        for i in rng:
            a, b = pts[(i - 1) % n], pts[(i + 1) % n]
            out[i] = (pts[i][0] + factor * ((a[0] + b[0]) / 2 - pts[i][0]),
                      pts[i][1] + factor * ((a[1] + b[1]) / 2 - pts[i][1]))
        pts = out
    return pts

def catmull_path(pts, closed=False):
    ext = ([pts[-1]] + pts + [pts[0], pts[1]]) if closed else ([pts[0]] + pts + [pts[-1]])
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
    """Join loose segments into continuous lines, open ones first."""
    adj = {}
    for a, b in segs:
        ka, kb = key_of(a), key_of(b)
        adj.setdefault(ka, []).append(kb)
        adj.setdefault(kb, []).append(ka)
    seen, lines = set(), []
    for pass_open in (True, False):
        for start in adj:
            if start in seen or (pass_open and len(adj[start]) != 1):
                continue
            line, cur, prev = [start], start, None
            seen.add(start)
            while True:
                nxts = [p for p in adj[cur] if p != prev and p not in seen]
                if not nxts:
                    if not pass_open:
                        line.append(start)
                    break
                prev, cur = cur, nxts[0]
                seen.add(cur)
                line.append(cur)
            lines.append((line, not pass_open))
    return lines

# ---------------- render ----------------
# One path per contour level, every one the same grey and weight.
parts = []
line_count = 0
for li in range(1, LEVELS + 1):
    iso = li / (LEVELS + 1)
    ds = []
    for line, closed in chain(segments_for(iso)):
        if len(line) < 4:
            continue
        thin = line[::2] if len(line) > 12 else line
        ds.append(catmull_path(laplacian_smooth(thin, closed), closed=closed))
        line_count += 1
    if ds:
        parts.append(f'<path d="{"".join(ds)}"/>')

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" '
    f'stroke="{STROKE}" stroke-width="{STROKE_W}" stroke-linejoin="round" stroke-linecap="round">\n'
    + "\n".join(parts)
    + "\n</svg>\n"
)

out = os.path.join(ROOT, "public", "assets", "contours.svg")
with io.open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write(svg)

print(f"contours.svg: {LEVELS} levels, {line_count} lines, {len(svg) // 1024} KB")
