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
  data/                   mapWaypoints.js, mapTrails.js (generated), projects.js, roles.js
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
  generate-map.py          Regenerates public/assets/contours.svg + src/data/mapTrails.js
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
exists as a page but can't be reached from the map overlay. That means
a new entry in `POSITIONS_INTENT`, `LEAF_KEYS`, `PARENT_OF`,
`ZOOM_GROUPS`, and `LINKS` in `tools/generate-map.py`, then
`npm run generate-map` and copy the printed position and zoom target
into `src/data/mapWaypoints.js`. The script flags leaves that snap too
close to their parent or to a sibling — nudge the intent and re-run
until it reports nothing. Keep map labels short (roughly two words):
they render as fixed-width boxes and long ones collide once a cluster
holds more than a few pins.

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

Edit `SEED` at the top of the script to re-roll the landscape. Waypoint
*positions* (which drive both the dots and the trail endpoints) live by
hand in `src/data/mapWaypoints.js` — keep the `POSITIONS` dict at the
top of `generate-map.py` in sync if you move a dot.
