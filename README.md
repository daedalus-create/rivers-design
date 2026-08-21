# Rivers Design — rivers-design.com

Portfolio site built with **React + Vite + React Router**, styled on the
Figma comp's palette/type.

## Stack

- **Vite** — dev server + build
- **React 19** — components
- **React Router 7** — client-side routing (`BrowserRouter`)
- **three.js** — the 3D placeholder viewers, lazy-loaded per page

## Structure

```
index.html              Vite entry (mounts src/main.jsx)
public/
  assets/                Logo, divider icons, generated contours.svg
  fonts/                 Ideation (your font) + Be Vietnam Pro (self-hosted)
  CNAME                  rivers-design.com, for GitHub Pages custom domain
src/
  main.jsx                Router + global CSS entry
  App.jsx                 Route table
  styles/global.css       Design tokens + all styling
  data/                   mapWaypoints.js (nav), mapGeometry.js + mapTrails.js
                          (both generated), projects.js, roles.js
  hooks/useReveal.js       Scroll-reveal hook
  components/
    Layout.jsx             Header + <Outlet/> + Footer, scroll-to-top/hash on route change
    Header.jsx              Logo, hamburger, date badge
    MapMenu.jsx              Interactive site-map overlay (click-to-zoom navigation)
    Divider.jsx              Page-break component (icon marks + wordmark + pill link)
    Footer.jsx
    ModelViewer.jsx          three.js placeholder viewer
    LazyModelViewer.jsx      code-split wrapper around ModelViewer (three.js is ~500KB)
  pages/                   One file per route (see below)
tools/
  generate-map.py          Regenerates contours.svg, mapTrails.js, mapGeometry.js
legacy-static/             Pre-React version of the site, kept for reference (not built/served)
```

## Routes

Every site-map waypoint is its own real page — no more anchors inside a
combined file:

```
/                              Home
/about                         About
/about/contact                 Contact
/experience                    Experience (hub — links to the three below)
/experience/work-excerpts      Role write-ups (SunThru, Dreki Systems, …)
/experience/resume             Resume
/experience/education          Education
/experience/classes            Classes taken at RPI
/experience/:slug              Individual role/education write-up
/projects                      Projects (hub — links to the three below)
/projects/completed            Completed projects list
/projects/in-progress          Work-in-progress list
/projects/planned              Planned projects list
/projects/:slug                Individual project page (one per entry in projects.js)
```

Project pages are data-driven from `src/data/projects.js` — add a new
entry there and `/projects/your-slug` exists automatically.

**When you add a project, also add its site-map waypoint**, or it
exists as a page but can't be reached from the map overlay:

1. Add the nav entry (`node`, `href`, `cluster`, `label`) to
   `src/data/mapWaypoints.js`.
2. Add a rough `(x%, y%)` to `POSITIONS_INTENT` in
   `tools/generate-map.py`, plus entries in `PARENT_OF`, `ZOOM_GROUPS`,
   and `LINKS`.
3. Run `npm run generate-map`.

No coordinates to copy by hand — the script writes
`src/data/mapGeometry.js` and `mapWaypoints.js` imports it. The intent
is only a wish: placement snaps it onto ground that makes sense to
stand on, resolves collisions itself, and fails the run if any two
simultaneously-visible labels would overlap. It also refuses to run if
the two files disagree about which waypoints exist, so they can't drift
apart. Keep labels short anyway — a long one forces its neighbours
further away and constrains the layout.

## Swapping in real 3D models

Each placeholder is a `<ModelViewer kind="…" />` (`engine`, `forge`,
`panel`, `drone`, `concept`) rendering a wireframe builder in
`src/components/ModelViewer.jsx`. When you have real CAD exports:

1. Export as `.glb`.
2. Drop the file in `public/assets/models/`.
3. Import `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`
   and load the file instead of calling the wireframe builder.

## Regenerating the site-map terrain

`tools/generate-map.py` builds the topographic background
(`public/assets/contours.svg`) and the terrain-following trail paths
(`src/data/mapTrails.js`) from one fractal-noise heightfield, so they
always agree with each other:

```bash
npm run generate-map
```

Edit `SEED` at the top of the script to re-roll the landscape.

It runs as a strict compute-then-render pipeline — terrain, summits,
rivers, waypoints, framing, routes, and only then any drawing — so each
phase can use the results of the ones before it. That ordering is
load-bearing: rivers steer clear of the hub summits, waypoint placement
steers clear of the rivers, and trails steer clear of both.

Waypoint *positions* are computed, not authored. `POSITIONS_INTENT` is a
rough wish per waypoint; placement then looks for nearby ground that
makes sense to stand on — low, level, near water but not in it, and
reachable from its parent without crossing a face — and rejects any
candidate that would crowd its parent or collide with a sibling's label
at that cluster's zoom scale. Results land in `src/data/mapGeometry.js`,
which `mapWaypoints.js` imports, so the dots and the trails bent to
those same coordinates cannot drift apart.

The palette is grey and white for terrain, with yellow reserved for the
navigation layer (trails and waypoint dots) so the one saturated hue on
the map always means "you can click this".
