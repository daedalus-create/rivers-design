import * as THREE from "three";

// Wireframe placeholder geometry for the 3D viewers, kept separate from
// ModelViewer.jsx so it can be exercised without a WebGL context: none of
// this touches a renderer, so a plain Node script can build every shape
// and assert it came out sane (see the smoke test in package.json).
//
// One builder per subject, deliberately. A single generic placeholder
// shared across a dozen unrelated pages tells a reader nothing and makes
// two different projects look like the same project, so each entry in
// projects.js / roles.js / education.js gets a shape that reads as the
// thing it stands for. `concept` remains only as the fallback for a new
// entry that has not been given its own yet.

const INK = 0xffffff;
const ACCENT = 0xffcc40;

function lineMat(color, opacity = 0.85) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

// Wireframe outline of a solid primitive.
function edges(geo, color = INK, opacity = 0.85) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), lineMat(color, opacity));
}

// A clean flat circle in the XZ plane. EdgesGeometry on a torus produces
// a dense mess of facet lines; an actual line loop reads as a drawn
// circle and costs a fraction of the geometry.
function circle(r, color = INK, opacity = 0.85, seg = 64) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, opacity));
}

// Polyline through explicit points — for outlines a box can't describe
// (an aircraft planform, a pediment, a spiral arm).
function poly(points, color = INK, opacity = 0.85, closed = false) {
  const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  if (closed && pts.length) pts.push(pts[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, opacity));
}

// Mirror a half-outline across x to guarantee a symmetric shape.
function mirrorX(points) {
  return [...points, ...points.slice(0, -1).reverse().map((p) => [-p[0], p[1], p[2]])];
}

// ---- declarative animation ----
// Builders describe what moves rather than the render loop hard-coding a
// fixed set of slots, so a placeholder can have several moving parts
// (the thruster's three fan stages run at different speeds, and the
// magnetic bearing's rotor both spins and floats).
const spin = (obj, axis, speed) => ({ t: "spin", obj, axis, speed });
const shuttle = (obj, axis, span, speed, phase = 0) => ({ t: "shuttle", obj, axis, span, speed, phase });
const orbit = (obj, radius, speed, phase = 0) => ({ t: "orbit", obj, radius, speed, phase });

// Radially arranged blades, used by both the jet engine and the thruster.
function bladeRing(count, len, color = INK, opacity = 0.55) {
  const ring = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const blade = edges(new THREE.BoxGeometry(0.05, len, 0.13), color, opacity);
    blade.position.y = len * 0.62;
    const holder = new THREE.Group();
    holder.add(blade);
    holder.rotation.x = (i / count) * Math.PI * 2;
    ring.add(holder);
  }
  return ring;
}

// ---------------- projects ----------------

// Pyro MK:7 — jet engine: nacelle, spinner cone, fan disc
function buildEngine() {
  const g = new THREE.Group();
  const nacelle = edges(new THREE.CylinderGeometry(1, 0.82, 2.6, 24, 1, true), INK);
  nacelle.rotation.z = Math.PI / 2;
  g.add(nacelle);

  const cone = edges(new THREE.ConeGeometry(0.34, 0.7, 16), ACCENT);
  cone.rotation.z = -Math.PI / 2;
  cone.position.x = 1.45;
  g.add(cone);

  const fan = bladeRing(12, 0.78);
  fan.rotation.z = Math.PI / 2;
  fan.position.x = 1.1;
  g.add(fan);

  const exhaust = edges(new THREE.CylinderGeometry(0.5, 0.36, 0.6, 16, 1, true), ACCENT, 0.6);
  exhaust.rotation.z = Math.PI / 2;
  exhaust.position.x = -1.55;
  g.add(exhaust);

  g.userData.anims = [spin(fan, "x", 1.6)];
  return g;
}

// G.A.S. [Core XY System] — gantry: bed, frame, CoreXY rail, carriage.
// Unused while the "forge" kind renders the animation iframe instead —
// kept as the wireframe fallback if that asset ever goes away.
function buildForge() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(3.2, 0.18, 1.6), INK));

  const frame = edges(new THREE.BoxGeometry(1.9, 1.5, 1.4), INK, 0.5);
  frame.position.y = 0.85;
  g.add(frame);

  const rail = edges(new THREE.BoxGeometry(3.0, 0.08, 0.08), ACCENT, 0.8);
  rail.position.set(0, 1.6, 0);
  g.add(rail);

  const carriage = edges(new THREE.BoxGeometry(0.36, 0.36, 0.36), ACCENT);
  carriage.position.y = 1.28;
  g.add(carriage);

  const part = edges(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), INK, 0.7);
  part.position.y = 0.35;
  g.add(part);

  g.userData.anims = [shuttle(carriage, "x", 1.2, 0.7)];
  return g;
}

// Orbital Maneuver Solver — a body, two orbits at different inclinations,
// and the transfer ellipse between them, with a craft running the transfer
function buildOrbit() {
  const g = new THREE.Group();
  g.add(edges(new THREE.IcosahedronGeometry(0.42, 0), INK, 0.8));

  const low = circle(0.95, INK, 0.45);
  g.add(low);

  const high = circle(1.6, INK, 0.35);
  high.rotation.x = 0.42;
  g.add(high);

  // transfer ellipse — the thing the tool actually solves for
  const ell = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ell.push([Math.cos(a) * 1.6, 0, Math.sin(a) * 0.95]);
  }
  g.add(poly(ell, ACCENT, 0.85, true));

  const craft = edges(new THREE.BoxGeometry(0.14, 0.1, 0.1), ACCENT);
  g.add(craft);

  g.userData.anims = [orbit(craft, 1.3, 0.75)];
  return g;
}

// Integrated Toolhead — reduction stage, fin stack, heater block, nozzle
function buildToolhead() {
  const g = new THREE.Group();

  const housing = edges(new THREE.CylinderGeometry(0.52, 0.52, 0.32, 22, 1, true), INK);
  housing.rotation.x = Math.PI / 2;
  housing.position.y = 0.6;
  g.add(housing);

  const disc = circle(0.34, ACCENT, 0.85);
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 0.6;
  g.add(disc);

  // filament entering the top
  g.add(poly([[0, 1.35, 0], [0, 0.78, 0]], INK, 0.45));

  for (let i = 0; i < 4; i++) {
    const fin = edges(new THREE.BoxGeometry(0.66, 0.03, 0.46), INK, 0.5);
    fin.position.y = 0.28 - i * 0.14;
    g.add(fin);
  }

  const block = edges(new THREE.BoxGeometry(0.4, 0.3, 0.4), ACCENT, 0.75);
  block.position.y = -0.44;
  g.add(block);

  const nozzle = edges(new THREE.ConeGeometry(0.13, 0.28, 14), ACCENT);
  nozzle.rotation.x = Math.PI;
  nozzle.position.y = -0.72;
  g.add(nozzle);

  g.userData.anims = [spin(disc, "z", 1.1)];
  return g;
}

// Blended Body Aircraft — planform outline, underwing nacelles on the
// structural hard point, wingtip yaw surfaces
function buildBWB() {
  const g = new THREE.Group();

  const half = [
    [0, 0, -1.6],
    [0.34, 0, -1.0],
    [0.78, 0, -0.4],
    [1.55, 0, 0.2],
    [1.95, 0, 0.52],
    [1.15, 0, 0.66],
    [0.5, 0, 0.8],
    [0, 0, 0.88],
  ];
  g.add(poly(mirrorX(half), INK, 0.85, true));

  // the body/wing transition the whole design turns on
  for (const s of [1, -1]) {
    g.add(poly([[s * 0.78, 0, -0.4], [s * 0.78, 0, 0.72]], ACCENT, 0.5));

    const nacelle = edges(new THREE.CylinderGeometry(0.15, 0.13, 0.5, 14, 1, true), ACCENT, 0.8);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(s * 1.05, -0.2, 0.15);
    g.add(nacelle);
    g.add(poly([[s * 1.05, -0.06, 0.15], [s * 1.05, -0.16, 0.15]], INK, 0.5));

    const fin = poly([[s * 1.95, 0, 0.52], [s * 1.9, 0.42, 0.46], [s * 1.86, 0.42, 0.6]], INK, 0.7);
    g.add(fin);
  }

  // centre body depth, so it doesn't read as a flat cutout
  g.add(poly([[0, -0.16, -1.1], [0, -0.16, 0.7]], INK, 0.35));
  return g;
}

// CM5 Cluster — long double-sided carrier, five modules per face
function buildCarrier() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(3.0, 0.06, 1.0), INK));

  for (const side of [1, -1]) {
    for (let i = 0; i < 5; i++) {
      const mod = edges(new THREE.BoxGeometry(0.42, 0.1, 0.6), ACCENT, side > 0 ? 0.8 : 0.45);
      mod.position.set(-1.2 + i * 0.6, side * 0.09, 0);
      g.add(mod);
    }
  }

  const header = edges(new THREE.BoxGeometry(0.1, 0.18, 0.8), INK, 0.6);
  header.position.x = 1.44;
  g.add(header);
  return g;
}

// High-Speed Motor — outer driven ring carrying poles, around a stator
function buildRingMotor() {
  const g = new THREE.Group();

  const rotor = new THREE.Group();
  // an axial-flux motor is a pancake, but not a zero-thickness one
  for (const y of [0.07, -0.07]) {
    const r1 = circle(1.15, ACCENT, 0.9);
    r1.position.y = y;
    rotor.add(r1);
    const r2 = circle(1.0, ACCENT, 0.45);
    r2.position.y = y;
    rotor.add(r2);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const pole = edges(new THREE.BoxGeometry(0.1, 0.07, 0.15), ACCENT, 0.7);
    pole.position.set(Math.cos(a) * 1.075, 0, Math.sin(a) * 1.075);
    pole.rotation.y = -a;
    rotor.add(pole);
  }
  g.add(rotor);

  g.add(circle(0.74, INK, 0.7));
  g.add(circle(0.32, INK, 0.5));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(poly([[Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34], [Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72]], INK, 0.4));
  }

  g.userData.anims = [spin(rotor, "y", 2.1)];
  return g;
}

// Multi-Stage Electric Thruster — duct with three matched fan stages
function buildThruster() {
  const g = new THREE.Group();

  const duct = edges(new THREE.CylinderGeometry(0.85, 0.85, 2.4, 26, 1, true), INK, 0.8);
  duct.rotation.z = Math.PI / 2;
  g.add(duct);

  const anims = [];
  for (let s = 0; s < 3; s++) {
    const stage = bladeRing(9, 0.6, INK, 0.5);
    stage.rotation.z = Math.PI / 2;
    stage.position.x = 0.72 - s * 0.72;
    g.add(stage);
    // each stage does a share of the work, so none of them runs at the
    // same rate as its neighbour
    anims.push(spin(stage, "x", 2.6 - s * 0.55));
  }

  for (const x of [1.2, -1.2]) {
    const lip = circle(0.85, ACCENT, 0.7);
    lip.rotation.z = Math.PI / 2;
    lip.position.x = x;
    g.add(lip);
  }

  g.userData.anims = anims;
  return g;
}

// Precision Linear Stage — rail, shuttling carriage, reduction disc
function buildLinearStage() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(2.8, 0.14, 0.34), INK));
  g.add(poly([[-1.4, 0.09, 0], [1.4, 0.09, 0]], ACCENT, 0.6));

  for (const x of [-1.45, 1.45]) {
    const stop = edges(new THREE.BoxGeometry(0.1, 0.3, 0.4), INK, 0.6);
    stop.position.set(x, 0.14, 0);
    g.add(stop);
  }

  const carriage = edges(new THREE.BoxGeometry(0.52, 0.34, 0.5), ACCENT);
  carriage.position.y = 0.24;
  g.add(carriage);

  const disc = circle(0.32, ACCENT, 0.8);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(-1.62, 0.1, 0);
  g.add(disc);

  g.userData.anims = [shuttle(carriage, "x", 1.05, 0.8), spin(disc, "z", -1.4)];
  return g;
}

// Omnidirectional Robot Base — chassis on two perpendicular wheel pairs,
// engaging a stud grid floor
function buildStudBase() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(1.15, 0.22, 1.15), INK));

  const anims = [];
  // one pair per axis — that is what makes it omnidirectional
  for (const [axis, s] of [["x", 1], ["x", -1], ["z", 1], ["z", -1]]) {
    const wheel = circle(0.26, ACCENT, 0.8);
    wheel.rotation.z = Math.PI / 2;
    if (axis === "z") wheel.rotation.y = Math.PI / 2;
    wheel.position.set(axis === "x" ? s * 0.66 : 0, -0.08, axis === "z" ? s * 0.66 : 0);
    g.add(wheel);
    anims.push(spin(wheel, axis === "x" ? "x" : "z", 2.4 * s));
  }

  const floor = edges(new THREE.BoxGeometry(2.6, 0.05, 2.6), INK, 0.3);
  floor.position.y = -0.42;
  g.add(floor);
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      const stud = edges(new THREE.BoxGeometry(0.07, 0.1, 0.07), INK, 0.45);
      stud.position.set(i * 0.36, -0.34, j * 0.36);
      g.add(stud);
    }
  }

  g.userData.anims = anims;
  return g;
}

// High-Temperature Bearing — races with a solid-contact ball train
function buildBearing() {
  const g = new THREE.Group();
  g.add(circle(0.98, INK, 0.8));
  g.add(circle(0.86, INK, 0.45));
  g.add(circle(0.56, INK, 0.8));
  g.add(circle(0.44, INK, 0.45));

  const balls = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const ball = edges(new THREE.IcosahedronGeometry(0.13, 0), ACCENT, 0.9);
    ball.position.set(Math.cos(a) * 0.71, 0, Math.sin(a) * 0.71);
    balls.add(ball);
  }
  g.add(balls);

  g.userData.anims = [spin(balls, "y", 0.9)];
  return g;
}

// Large-Diameter Air Bearing — thin rotor ring inside its housing, with
// the film gap called out all the way around
function buildAirBearing() {
  const g = new THREE.Group();

  // Axial width matters here: a ring built from coplanar circles is
  // geometrically flat and disappears to a single line when the scene
  // rotates edge-on, so the rotor and housing are given real depth.
  const rotor = new THREE.Group();
  for (const y of [0.09, -0.09]) {
    const outer = circle(1.22, ACCENT, 0.9);
    outer.position.y = y;
    rotor.add(outer);
    const inner = circle(1.14, ACCENT, 0.5);
    inner.position.y = y;
    rotor.add(inner);
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    rotor.add(poly([
      [Math.cos(a) * 1.18, 0.09, Math.sin(a) * 1.18],
      [Math.cos(a) * 1.18, -0.09, Math.sin(a) * 1.18],
    ], ACCENT, 0.3));
  }
  g.add(rotor);

  for (const y of [0.16, -0.16]) {
    const h1 = circle(1.42, INK, 0.7);
    h1.position.y = y;
    g.add(h1);
    const h2 = circle(1.32, INK, 0.4);
    h2.position.y = y;
    g.add(h2);
  }
  // the uniform film the design is chasing
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    g.add(poly([
      [Math.cos(a) * 1.24, 0, Math.sin(a) * 1.24],
      [Math.cos(a) * 1.31, 0, Math.sin(a) * 1.31],
    ], INK, 0.5));
  }

  g.userData.anims = [spin(rotor, "y", 2.8)];
  return g;
}

// Unpowered Magnetic Bearing — alternating permanent-magnet stator with a
// rotor that floats in it (hence the slow bob as well as the spin)
function buildMagBearing() {
  const g = new THREE.Group();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const mag = edges(new THREE.BoxGeometry(0.2, 0.16, 0.28), i % 2 ? INK : ACCENT, 0.8);
    mag.position.set(Math.cos(a) * 1.08, 0, Math.sin(a) * 1.08);
    mag.rotation.y = -a;
    g.add(mag);
  }
  g.add(circle(1.26, INK, 0.35));

  const rotor = new THREE.Group();
  rotor.add(circle(0.74, ACCENT, 0.9));
  rotor.add(circle(0.62, ACCENT, 0.5));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    rotor.add(poly([[0, 0, 0], [Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62]], ACCENT, 0.3));
  }
  g.add(rotor);

  g.userData.anims = [spin(rotor, "y", 1.9), shuttle(rotor, "y", 0.07, 0.9)];
  return g;
}

// Modular Plant Exoskeleton — ribbed printed shell around a pot, with the
// reservoir band at the base
function buildPlanter() {
  const g = new THREE.Group();

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.add(poly([
      [Math.cos(a) * 0.5, -0.62, Math.sin(a) * 0.5],
      [Math.cos(a) * 0.62, -0.1, Math.sin(a) * 0.62],
      [Math.cos(a) * 0.72, 0.46, Math.sin(a) * 0.72],
    ], INK, 0.65));
  }

  const base = circle(0.5, ACCENT, 0.85);
  base.position.y = -0.62;
  g.add(base);
  const reservoir = circle(0.56, ACCENT, 0.5);
  reservoir.position.y = -0.42;
  g.add(reservoir);
  const lip = circle(0.72, INK, 0.8);
  lip.position.y = 0.46;
  g.add(lip);

  g.add(poly([[0, -0.3, 0], [0.05, 0.35, 0.05], [-0.02, 0.8, 0.1]], INK, 0.7));
  for (const [dx, dz] of [[0.3, 0.12], [-0.26, 0.2], [0.08, -0.3]]) {
    g.add(poly([[0, 0.62, 0.06], [dx, 0.86, dz], [dx * 0.4, 0.7, dz * 0.4]], INK, 0.5, true));
  }
  return g;
}

// Envisage — a generated galaxy: core, spiral arms, halo
function buildGalaxy() {
  const g = new THREE.Group();
  g.add(edges(new THREE.IcosahedronGeometry(0.26, 0), ACCENT, 0.9));

  const arms = new THREE.Group();
  for (let a = 0; a < 3; a++) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const ang = (a / 3) * Math.PI * 2 + t * 2.4;
      const r = 0.3 + t * 1.35;
      pts.push([Math.cos(ang) * r, Math.sin(t * Math.PI * 2) * 0.06, Math.sin(ang) * r]);
    }
    arms.add(poly(pts, INK, 0.6));
  }
  g.add(arms);

  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const r = 0.7 + (i % 3) * 0.35;
    const star = edges(new THREE.OctahedronGeometry(0.07, 0), ACCENT, 0.8);
    star.position.set(Math.cos(ang) * r, ((i % 2) - 0.5) * 0.2, Math.sin(ang) * r);
    g.add(star);
  }

  g.add(circle(1.75, INK, 0.2));

  g.userData.anims = [spin(arms, "y", 0.35)];
  return g;
}

// ---------------- work experience & education ----------------

// SunThru — aerogel monolith: thin translucent slab in a frame
function buildPanel() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(2.6, 1.7, 0.16), INK));
  const inner = edges(new THREE.BoxGeometry(2.3, 1.4, 0.08), ACCENT, 0.7);
  g.add(inner);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.4),
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
  );
  g.add(glow);
  return g;
}

// Dreki Systems — quad drone: hub, arms, rotor discs
function buildDrone() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(0.7, 0.24, 0.7), INK));

  const anims = [];
  const R = 1.15;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const arm = edges(new THREE.BoxGeometry(1.15, 0.08, 0.1), INK, 0.6);
    arm.position.set((sx * R) / 2, 0.05, (sz * R) / 2);
    arm.rotation.y = Math.atan2(-sz, sx);
    g.add(arm);

    const disc = circle(0.42, ACCENT, 0.8);
    disc.position.set(sx * R, 0.14, sz * R);
    g.add(disc);
    anims.push(spin(disc, "y", 6));
  }

  g.userData.anims = anims;
  return g;
}

// Piasecki Steel — structural fabrication: beam, plate, and the ladder
// cage the internship actually built
function buildWeldment() {
  const g = new THREE.Group();

  // I-beam
  for (const y of [0.34, -0.34]) {
    const flange = edges(new THREE.BoxGeometry(2.4, 0.09, 0.62), INK, 0.8);
    flange.position.set(0, y, 0);
    g.add(flange);
  }
  const web = edges(new THREE.BoxGeometry(2.4, 0.6, 0.08), INK, 0.55);
  g.add(web);

  // ladder with its safety cage
  const ladder = new THREE.Group();
  for (const x of [-0.22, 0.22]) g.add(poly([[x, -0.3, 1.0], [x, 1.5, 1.0]], ACCENT, 0.85));
  for (let i = 0; i < 6; i++) {
    ladder.add(poly([[-0.22, -0.2 + i * 0.3, 1.0], [0.22, -0.2 + i * 0.3, 1.0]], ACCENT, 0.7));
  }
  for (const y of [0.15, 0.75, 1.35]) {
    const hoop = circle(0.42, INK, 0.4);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.set(0, y, 1.0);
    ladder.add(hoop);
  }
  g.add(ladder);
  return g;
}

// Student Living & Learning — the office side of the work: desk, screen,
// and the paperwork that moves across it
function buildDesk() {
  const g = new THREE.Group();
  const top = edges(new THREE.BoxGeometry(1.9, 0.07, 0.95), INK);
  g.add(top);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.add(poly([[sx * 0.88, -0.04, sz * 0.4], [sx * 0.88, -0.75, sz * 0.4]], INK, 0.5));
  }

  const screen = edges(new THREE.BoxGeometry(0.86, 0.54, 0.04), ACCENT, 0.85);
  screen.position.set(-0.2, 0.38, -0.22);
  g.add(screen);
  g.add(poly([[-0.2, 0.11, -0.22], [-0.2, 0.04, -0.16]], INK, 0.5));

  for (let i = 0; i < 3; i++) {
    const sheet = edges(new THREE.BoxGeometry(0.44, 0.015, 0.32), INK, 0.55);
    sheet.position.set(0.62, 0.05 + i * 0.03, 0.16);
    sheet.rotation.y = i * 0.06;
    g.add(sheet);
  }
  return g;
}

// RPI — the campus: a columned academic facade on its steps
function buildCampus() {
  const g = new THREE.Group();
  g.add(edges(new THREE.BoxGeometry(2.0, 0.95, 1.1), INK, 0.8));

  for (let i = 0; i < 5; i++) {
    const col = edges(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 10, 1, true), INK, 0.6);
    col.position.set(-0.72 + i * 0.36, -0.02, 0.62);
    g.add(col);
  }

  g.add(poly([[-0.95, 0.44, 0.62], [0, 0.86, 0.62], [0.95, 0.44, 0.62]], ACCENT, 0.9));
  g.add(poly([[-0.95, 0.44, 0.62], [0.95, 0.44, 0.62]], ACCENT, 0.6));

  for (let i = 0; i < 3; i++) {
    const step = edges(new THREE.BoxGeometry(1.5 - i * 0.16, 0.07, 0.36 - i * 0.08), INK, 0.45);
    step.position.set(0, -0.52 - i * 0.07, 0.78 + i * 0.1);
    g.add(step);
  }
  return g;
}

// Fallback for a new entry that hasn't been given its own shape yet.
export function buildConcept() {
  const g = new THREE.Group();
  g.add(edges(new THREE.IcosahedronGeometry(1.05, 0), INK, 0.7));
  const inner = edges(new THREE.OctahedronGeometry(0.5, 0), ACCENT, 0.8);
  g.add(inner);
  g.userData.anims = [spin(inner, "y", -0.9)];
  return g;
}

export const BUILDERS = {
  // projects
  engine: buildEngine,
  forge: buildForge,
  orbit: buildOrbit,
  toolhead: buildToolhead,
  bwb: buildBWB,
  carrier: buildCarrier,
  ringmotor: buildRingMotor,
  thruster: buildThruster,
  linearstage: buildLinearStage,
  studbase: buildStudBase,
  bearing: buildBearing,
  airbearing: buildAirBearing,
  magbearing: buildMagBearing,
  planter: buildPlanter,
  galaxy: buildGalaxy,
  // experience & education
  panel: buildPanel,
  drone: buildDrone,
  weldment: buildWeldment,
  desk: buildDesk,
  campus: buildCampus,
  // fallback
  concept: buildConcept,
};
