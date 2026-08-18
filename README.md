# Rivers Design — rivers-design.com

Portfolio site built with **React + Vite + React Router**, styled on the
Figma comp's palette/type and the sizing/spacing/motion system of
merttureli.com.

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
/experience                    Experience (hub — links to the two below)
/experience/work-excerpts      Role write-ups (SunThru, Dreki Systems)
/experience/resume             Resume
/projects                      Projects (hub — links to the two below)
/projects/completed            Completed projects list
/projects/still-working        In-progress project plans list
/projects/:slug                Individual project page (pyro-mk7, hephaestus-forge, plan-1, plan-2)
```

Project pages are data-driven from `src/data/projects.js` — add a new
entry there and `/projects/your-slug` exists automatically.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

## Build

```bash
npm run build
```

Outputs static files to `dist/`. The `postbuild` script automatically
copies `dist/index.html` to `dist/404.html` — this is the standard trick
for serving a client-routed SPA from GitHub Pages, which has no server
to rewrite unknown paths back to `index.html` itself.

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

## Deploying to rivers-design.com (Squarespace domain)

The domain is registered at Squarespace, but the built site is fully
static, so it can be hosted anywhere. Easiest path — GitHub Pages:

1. Push this repo to GitHub, enable **Settings → Pages** on the branch
   that contains a built `dist/` (or add a GitHub Actions workflow that
   runs `npm run build` and publishes `dist/`). The `public/CNAME` file
   ends up in `dist/CNAME` automatically.
2. In Squarespace: **Settings → Domains → rivers-design.com → DNS
   Settings**, then add:
   - Four `A` records, host `@`, pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One `CNAME` record, host `www`, pointing to `<your-github-username>.github.io`
3. Back in GitHub Pages settings, enter `rivers-design.com` as the
   custom domain and enable **Enforce HTTPS** once the check passes.

Netlify or Cloudflare Pages work just as well — connect the repo, set
the build command to `npm run build` and the publish directory to
`dist`, then point Squarespace DNS at the host they give you. Both
handle SPA routing natively, so the manual `404.html` copy step is only
required for GitHub Pages.
