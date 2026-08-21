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

## Deploying to rivers-design.com

Hosted on **GitHub Pages**, built by GitHub Actions. Repo:
[daedalus-create/rivers-design](https://github.com/daedalus-create/rivers-design).

Every push to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm ci`, `npm run lint`, `npm run build`, and publishes `dist/` to
Pages. Nothing to do by hand — commit and push:

```bash
git push
```

Watch the run with `gh run watch`, or on the Actions tab.

The custom domain is set on the Pages config (not via `public/CNAME` —
with the Actions build source, GitHub reads the domain from repo
settings, so the `CNAME` file is vestigial but harmless).

### DNS at Squarespace

The domain is registered at Squarespace. **Settings → Domains →
rivers-design.com → DNS Settings**, then replace Squarespace's default
records with:

| Type  | Host | Value                      |
|-------|------|----------------------------|
| A     | `@`  | `185.199.108.153`          |
| A     | `@`  | `185.199.109.153`          |
| A     | `@`  | `185.199.110.153`          |
| A     | `@`  | `185.199.111.153`          |
| CNAME | `www`| `daedalus-create.github.io`|

Delete the four pre-existing `@` A records pointing at Squarespace's
own hosting (`198.185.159.x` / `198.49.23.x`) and repoint the `www`
CNAME away from `ext-sq.squarespace.com`, or the domain keeps serving
Squarespace instead of this site.

Once DNS propagates, enable **Enforce HTTPS** under Settings → Pages
(GitHub can't provision the certificate until the records resolve to
it).
