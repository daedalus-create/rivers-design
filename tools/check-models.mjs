// Smoke test for the 3D placeholder builders.
//
// The builders in src/components/modelBuilders.js only construct three.js
// geometry — no renderer, no DOM — so every one can be built here and
// checked without a browser. This catches the failure modes that a page
// load does not: a builder that silently returns an empty group, one that
// puts NaN in a position, one that drifts far outside the camera framing,
// or an animation descriptor pointing at an object that was never added.
//
// Run: npm run check-models
import * as THREE from "three";
import { BUILDERS } from "../src/components/modelBuilders.js";
import { projects } from "../src/data/projects.js";
import { roles } from "../src/data/roles.js";
import { education } from "../src/data/education.js";

// Camera sits at (2.6, 1.6, 3.4) with a 38-degree lens, so anything much
// past this is off-frame or dwarfs its neighbours.
const MAX_EXTENT = 4.0;
const MIN_LINES = 2;

let failures = 0;
const fail = (name, msg) => {
  console.error(`  FAIL  ${name}: ${msg}`);
  failures++;
};

console.log(`Building ${Object.keys(BUILDERS).length} placeholder models\n`);

for (const [kind, build] of Object.entries(BUILDERS)) {
  let model;
  try {
    model = build();
  } catch (err) {
    fail(kind, `threw ${err.message}`);
    continue;
  }

  if (!(model instanceof THREE.Group)) {
    fail(kind, "did not return a THREE.Group");
    continue;
  }

  // count drawable line/mesh descendants
  let lines = 0;
  let badVec = null;
  model.traverse((o) => {
    if (o.isLine || o.isLineSegments || o.isMesh) lines++;
    const p = o.position;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) badVec = o;
  });

  if (lines < MIN_LINES) fail(kind, `only ${lines} drawable object(s) — looks empty`);
  if (badVec) fail(kind, "has a non-finite position");

  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) {
    fail(kind, "bounding box is empty");
  } else {
    const size = box.getSize(new THREE.Vector3());
    const worst = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(worst)) fail(kind, "bounding box is not finite");
    else if (worst > MAX_EXTENT) fail(kind, `extends ${worst.toFixed(2)} units (cap ${MAX_EXTENT})`);
  }

  // every animation target must actually be part of the model, or it
  // animates something invisible
  for (const a of model.userData.anims || []) {
    if (!a.obj) {
      fail(kind, `anim "${a.t}" has no target`);
      continue;
    }
    let attached = false;
    model.traverse((o) => {
      if (o === a.obj) attached = true;
    });
    if (!attached) fail(kind, `anim "${a.t}" targets an object not in the model`);
    if (a.t === "spin" && !["x", "y", "z"].includes(a.axis)) fail(kind, `spin axis "${a.axis}" invalid`);
    if (!Number.isFinite(a.speed)) fail(kind, `anim "${a.t}" speed is not finite`);
  }

  if (!failures) {
    const size = box.getSize(new THREE.Vector3());
    const anims = (model.userData.anims || []).length;
    console.log(
      `  ok    ${kind.padEnd(12)} ${String(lines).padStart(3)} objects, ` +
        `${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)}, ${anims} anim(s)`,
    );
  }
}

// Every entry that renders a viewer must name a builder that exists —
// an unknown kind silently falls back to the generic wireframe, which is
// exactly the "everything looks the same" problem this set fixes.
console.log("\nChecking model assignments");
const used = new Map();
for (const [label, list] of [["projects", projects], ["roles", roles], ["education", education]]) {
  for (const item of list) {
    if (!item.model) {
      fail(`${label}/${item.slug}`, "has no model kind");
      continue;
    }
    if (!BUILDERS[item.model]) fail(`${label}/${item.slug}`, `unknown model kind "${item.model}"`);
    used.set(item.model, [...(used.get(item.model) || []), `${label}/${item.slug}`]);
  }
}

const shared = [...used.entries()].filter(([, who]) => who.length > 1);
for (const [kind, who] of shared) {
  console.log(`  note  "${kind}" is shared by ${who.length}: ${who.join(", ")}`);
}
const unused = Object.keys(BUILDERS).filter((k) => !used.has(k));
if (unused.length) console.log(`  note  builders with no entry using them: ${unused.join(", ")}`);

console.log(
  failures
    ? `\n${failures} failure(s).`
    : `\nAll ${Object.keys(BUILDERS).length} builders sane; ${used.size} kinds in use across ${
        projects.length + roles.length + education.length
      } entries.`,
);
process.exit(failures ? 1 : 0);
