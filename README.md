# Rivers Design — rivers-design.com

Portfolio site built from the Figma comp, restyled onto the sizing / spacing /
motion system of merttureli.com. Fully static — no build step.

## Structure

```
index.html         Home: The Idea / The Dream, Projects, Experience previews
projects.html      Pyro MK:7, Hephaestus Forge — full entries + spec tables
experience.html    SunThru, Dreki Systems — role entries
about.html         Bio + The Idea / The Dream + quick-facts table
css/style.css      Design tokens + all styling
js/main.js         Date badge + scroll reveals
js/models.js       Three.js 3D placeholder viewers
fonts/             Ideation (your font) + Be Vietnam Pro (self-hosted)
assets/            Logo + divider SVGs exported from the Figma
vendor/            three.js + OrbitControls (vendored, no CDN)
CNAME              For GitHub Pages custom-domain deploys
```

## Run locally

```bash
python -m http.server 8137
```

Then open http://localhost:8137. (A server is required — ES modules don't run
from `file://`.)

## Swapping in real 3D models

Each placeholder is a `.model-frame` with a `data-model` attribute
(`engine`, `forge`, `panel`, `drone`) that maps to a wireframe builder in
`js/models.js`. When you have real CAD exports:

1. Export as `.glb` (from Fusion/SolidWorks via Blender, or any glTF exporter).
2. Drop them in `assets/models/`.
3. In `js/models.js`, import `GLTFLoader` from
   `three/addons/loaders/GLTFLoader.js` (download it into `vendor/` the same
   way OrbitControls is) and load the file instead of calling the builder.

## Deploying to rivers-design.com (Squarespace domain)

The domain is registered at Squarespace, but the site itself can be hosted
anywhere static. Easiest path — GitHub Pages:

1. Push this folder to a GitHub repo, enable **Settings → Pages** on the main
   branch. The `CNAME` file is already in place.
2. In Squarespace: **Settings → Domains → rivers-design.com → DNS Settings**,
   then add:
   - Four `A` records, host `@`, pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One `CNAME` record, host `www`, pointing to `<your-github-username>.github.io`
3. Back in GitHub Pages settings, enter `rivers-design.com` as the custom
   domain and enable **Enforce HTTPS** once the check passes.

Netlify or Cloudflare Pages work equally well (drag-and-drop the folder, then
point Squarespace DNS at the host they give you).
