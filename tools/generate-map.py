"""Rivers Design site-map generator.

One noise heightfield drives everything so it all agrees:
  - assets/contours.svg        organic topo background (smoothed)
  - .map__regions svg          territory boundaries per page cluster
  - .map__trails svg           terrain-following web trails
  - .wp waypoints              click targets, tagged with data-node /
                                data-cluster so CSS + main.js can hide
                                child waypoints until their hub is
                                clicked (click-to-zoom navigation)

Run from anywhere; edit SEED to re-roll the landscape.
"""
import random, math, io, re, os

SEED = 7
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PAGES = {"index.html": "home", "about.html": "about",
         "projects.html": "projects", "experience.html": "experience"}

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
        # downsample then smooth twice: removes the marching-squares
        # zigzag so the line reads as a hand-drawn contour, not a
        # polygon — this is the "organic, not sharp" pass
        thin = line[::2] if len(line) > 12 else line
        smooth = laplacian_smooth(thin, closed, iterations=3, factor=0.6)
        ds.append(catmull_path(smooth, closed=closed))
    if ds:
        parts.append(f'<path d="{"".join(ds)}" stroke="{stroke}" stroke-width="{width}"/>')

contours_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'fill="none" stroke-linejoin="round" stroke-linecap="round">\n'
                + "\n".join(parts) + "\n</svg>\n")
with io.open(os.path.join(ROOT, "assets", "contours.svg"), "w", encoding="utf-8") as f:
    f.write(contours_svg)
print("contours.svg:", len(contours_svg) // 1024, "KB")

# ---------------- clusters ----------------
# key -> (href, x%, y%, cluster, extra-class, label)
# cluster "hub" = always visible; other clusters hidden until their
# hub waypoint is clicked (see main.js zoom logic + CSS below)
WAYPOINTS = [
    ("home",       "index.html",              50, 16, "hub",        "wp--home", "Home"),
    ("experience", "experience.html",         22, 40, "hub",        "wp--page", "Experience"),
    ("work",       "experience.html#work",    12, 66, "experience", "",         "Work Excerpts"),
    ("resume",     "experience.html#resume",  31, 74, "experience", "",         "Resume"),
    ("projects",   "projects.html",           52, 50, "hub",        "wp--page", "Projects"),
    ("completed",  "projects.html#completed", 43, 72, "projects",   "",         "Completed"),
    ("pages",      "projects.html#pyro",      38, 90, "projects",   "wp--up",   "Project Pages"),
    ("working",    "projects.html#plans",     63, 73, "projects",   "",         "Still Working"),
    ("plans",      "projects.html#plans",     68, 90, "projects",   "wp--up",   "Project Plans"),
    ("about",      "about.html",              82, 38, "hub",        "wp--page", "About Me"),
    ("contact",    "about.html#contact",      87, 66, "about",      "",         "Contact"),
]
N = {k: (x / 100 * W, y / 100 * H) for k, _, x, y, *_ in WAYPOINTS}

# Zoom-target centers per cluster, as a fraction of container width/height
# (0..1). These used to also be territory-ellipse centers when the map
# drew dashed "circle" boundaries around each cluster; those boundaries
# were removed, but the centers still anchor where main.js zooms the
# .map__scene when a hub waypoint is clicked.
ZOOM_TARGETS = {
    "experience": (0.215, 0.60, 1.4),
    "projects": (0.528, 0.725, 1.4),
    "about": (0.845, 0.52, 1.65),
}

# (from, to, kind, cluster) — cluster "hub" always visible; others only
# visible while their cluster is the active zoom
LINKS = [
    ("home", "experience", "p", "hub"), ("home", "projects", "p", "hub"), ("home", "about", "p", "hub"),
    ("experience", "work", "p", "experience"), ("experience", "resume", "p", "experience"),
    ("projects", "completed", "p", "projects"), ("completed", "pages", "p", "projects"),
    ("projects", "working", "p", "projects"), ("working", "plans", "p", "projects"),
    ("about", "contact", "p", "about"),
    ("experience", "projects", "s", "hub"), ("projects", "about", "s", "hub"),
    ("work", "resume", "s", "experience"), ("pages", "plans", "s", "projects"),
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

trail_paths = []
for a, b, kind, cluster in LINKS:
    d = catmull_path(trail_points(N[a], N[b]))
    if kind == "p":
        style = 'stroke="#5a5a5a" stroke-width="2" stroke-dasharray="2 9"'
    else:
        style = 'stroke="#454545" stroke-width="1.5" stroke-dasharray="1 8"'
    trail_paths.append(f'<path d="{d}" {style} stroke-linecap="round" '
                        f'data-cluster="{cluster}" vector-effect="non-scaling-stroke"/>')

trails_svg = ('<svg class="map__trails" viewBox="0 0 1000 600" preserveAspectRatio="none" '
              'aria-hidden="true" fill="none">\n              '
              + "\n              ".join(trail_paths) + "\n            </svg>")

def waypoints_html(current_page_key):
    out = []
    for key_, href, x, y, cluster, extra, label in WAYPOINTS:
        classes = ("wp " + extra).strip()
        cur = ' aria-current="page"' if key_ == current_page_key else ""
        out.append(
            f'<a class="{classes}" style="--x:{x}%;--y:{y}%" href="{href}" '
            f'data-node="{key_}" data-cluster="{cluster}"{cur}>'
            f'<span class="wp__dot" aria-hidden="true"></span>'
            f'<span class="wp__label">{label}</span></a>'
        )
    return "\n            ".join(out)

def build_nav(current_page_key):
    return f'''<nav class="menu-map-wrap" aria-label="Site map">
          <div class="map">
            <button class="map__back" type="button">&larr; Map</button>
            <div class="map__scene">
              {trails_svg}
              {waypoints_html(current_page_key)}
            </div>
            <div class="map__legend" aria-hidden="true">
              <span><i class="dot--page"></i>Page</span>
              <span><i></i>Section</span>
              <span><i class="dot--here"></i>You are here</span>
            </div>
          </div>
        </nav>'''

pat_nav = re.compile(r'<nav class="menu-map-wrap".*?</nav>', re.S)
pat_ver = re.compile(r'css/style\.css\?v=\d+')
pat_js_ver = re.compile(r'js/main\.js\?v=\d+')

for fname, cur in PAGES.items():
    path = os.path.join(ROOT, fname)
    with io.open(path, encoding="utf-8") as f:
        html = f.read()
    html, n = pat_nav.subn(build_nav(cur), html)
    html = pat_ver.sub("css/style.css?v=13", html)
    html = pat_js_ver.sub("js/main.js?v=4", html)
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(fname, "nav replaced:", n)
