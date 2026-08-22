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
  data/                   siteTree.js (nav graph), projects.js, roles.js,
                          education.js, classes.js
  hooks/useReveal.js       Scroll-reveal hook
  components/
    Layout.jsx             Header + <Outlet/> + Footer, scroll-to-top/hash on route change
    Header.jsx              Logo, hamburger, date badge
    MenuTree.jsx             Branching site menu overlay
    Letters.jsx              Splits a label for the hover animation
    Divider.jsx              Page-break component (icon marks + wordmark + pill link)
    Footer.jsx
    ModelViewer.jsx          three.js placeholder viewer (render loop only)
    modelBuilders.js         one wireframe builder per project/role/school
    LazyModelViewer.jsx      code-split wrapper around ModelViewer (three.js is ~500KB)
  pages/                   One file per route (see below)
tools/
  generate-map.py          Regenerates the contours.svg backdrop
  check-models.mjs         Smoke-tests every 3D placeholder builder
  check-copy.mjs           Fails on banned characters in user-facing copy
legacy-static/             Pre-React version of the site, kept for reference (not built/served)
```

## Routes

Every entry in the site menu is its own real page:

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

**When you add a project, add it to the menu too**, or it exists as a
page but cannot be reached: add the entry (`node`, `href`, `cluster`,
`label`) to `src/data/siteTree.js`. `cluster` is the parent's node id,
and the menu branches along it automatically — there is nothing to
position or regenerate.

## Swapping in real 3D models

Each placeholder is a `<ModelViewer kind="…" />` whose `kind` names a
wireframe builder in `src/components/modelBuilders.js`. There is one
builder per subject rather than a handful shared around — a generic shape
on a dozen pages tells a reader nothing and makes two different projects
look like the same project. `concept` survives only as the fallback for a
new entry that has not been given its own shape yet, and an unknown kind
falls back to it silently.

Builders construct three.js geometry and never touch a renderer, so they
can be checked without a browser:

```bash
npm run check-models
```

That builds every shape and fails on the things a page load will not
catch: an empty group, a non-finite position, a model that outgrows the
camera framing, an animation pointing at an object that was never added,
or an entry in `projects.js` / `roles.js` / `education.js` naming a
builder that does not exist. It also reports any kind shared by more than
one entry.

Movement is declarative — a builder returns `userData.anims`, a list of
`spin` / `shuttle` / `orbit` descriptors, and the render loop in
`ModelViewer.jsx` applies them. That is why the thruster can turn three
fan stages at three speeds and the magnetic bearing can spin and float at
once.

When you have real CAD exports:

1. Export as `.glb`.
2. Drop the file in `public/assets/models/`.
3. Import `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`
   and load the file instead of calling the wireframe builder.

## Regenerating the backdrop

`tools/generate-map.py` builds the contour drawing behind the site from
a fractal-noise heightfield:

```bash
npm run generate-map
```

Edit `SEED` at the top to re-roll the landscape.

It used to be much more than this: it placed waypoints on the terrain,
traced rivers, routed A* trails between pages, and solved zoom framing
for a click-to-explore site map. The branching menu replaced all of that,
so the script now does three things only, in about a fifth of the code:
build a heightfield, trace contours, write the SVG. Every line is the
same grey and the same weight, deliberately, and it is kept dark and thin
so it recedes behind text rather than competing with it. Opacity is set
in CSS, so tuning how present it feels needs no regeneration.

It appears twice: full bleed behind the site menu, where it reads as the
map's terrain, and down the side margins of the pages, masked to nothing
across the middle so it never sits under a line of text.
