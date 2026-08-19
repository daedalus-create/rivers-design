import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 3D placeholder viewers. Each `kind` gets a slow-spinning wireframe
// placeholder. Swap buildPlaceholder() output for a GLTF load (three's
// GLTFLoader) when real models are ready — see README.

const INK = 0xffffff;
const ACCENT = 0xffcc40;

function lineMat(color, opacity = 0.85) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

function edges(geo, color, opacity) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), lineMat(color, opacity));
}

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

  const fan = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const blade = edges(new THREE.BoxGeometry(0.06, 0.78, 0.16), INK, 0.55);
    blade.position.y = 0.5;
    const holder = new THREE.Group();
    holder.add(blade);
    holder.rotation.x = (i / 12) * Math.PI * 2;
    fan.add(holder);
  }
  fan.rotation.z = Math.PI / 2;
  fan.position.x = 1.1;
  g.add(fan);
  g.userData.spin = { obj: fan, axis: "x", speed: 1.6 };

  const exhaust = edges(new THREE.CylinderGeometry(0.5, 0.36, 0.6, 16, 1, true), ACCENT, 0.6);
  exhaust.rotation.z = Math.PI / 2;
  exhaust.position.x = -1.55;
  g.add(exhaust);
  return g;
}

// Hephaestus Forge — gantry assembly line: bed, frame, carriage
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
  g.userData.shuttle = { obj: carriage, axis: "x", span: 1.2, speed: 0.7 };

  const part = edges(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), INK, 0.7);
  part.position.y = 0.35;
  g.add(part);
  return g;
}

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
  const hub = edges(new THREE.BoxGeometry(0.7, 0.24, 0.7), INK);
  g.add(hub);
  const rotors = [];
  const R = 1.15;
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    const arm = edges(new THREE.BoxGeometry(1.15, 0.08, 0.1), INK, 0.6);
    arm.position.set((sx * R) / 2, 0.05, (sz * R) / 2);
    arm.rotation.y = Math.atan2(-sz, sx);
    g.add(arm);
    const disc = edges(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 20), ACCENT, 0.8);
    disc.position.set(sx * R, 0.14, sz * R);
    g.add(disc);
    rotors.push(disc);
  }
  g.userData.rotors = rotors;
  return g;
}

// Concept-stage placeholder — a bare wireframe icosahedron, for
// projects that are still just an idea (no CAD committed yet)
function buildConcept() {
  const g = new THREE.Group();
  const core = edges(new THREE.IcosahedronGeometry(1.05, 0), INK, 0.7);
  g.add(core);
  const inner = edges(new THREE.OctahedronGeometry(0.5, 0), ACCENT, 0.8);
  g.add(inner);
  g.userData.spin = { obj: inner, axis: "y", speed: -0.9 };
  return g;
}

const BUILDERS = {
  engine: buildEngine,
  forge: buildForge,
  panel: buildPanel,
  drone: buildDrone,
  concept: buildConcept,
};

export default function ModelViewer({ kind = "engine", tag = "3D Placeholder / Model pending", height }) {
  const frameRef = useRef(null);

  useEffect(() => {
    if (kind === "forge") return undefined;
    const frame = frameRef.current;
    if (!frame) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(2.6, 1.6, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    frame.appendChild(renderer.domElement);

    const model = (BUILDERS[kind] || buildEngine)();
    scene.add(model);

    const grid = new THREE.GridHelper(7, 14, 0x555555, 0x333333);
    grid.position.y = -1.15;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;

    let lastW = 0;
    let lastH = 0;
    function resize() {
      const w = frame.clientWidth;
      const h = frame.clientHeight;
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w;
      lastH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(frame);
    resize();

    const timer = new THREE.Timer();
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, { threshold: 0 });
    io.observe(frame);

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      resize();
      timer.update();
      const t = timer.getElapsed();
      model.rotation.y = t * 0.25;

      const { spin, shuttle, rotors } = model.userData;
      if (spin) spin.obj.rotation[spin.axis] = t * spin.speed;
      if (shuttle) shuttle.obj.position[shuttle.axis] = Math.sin(t * shuttle.speed) * shuttle.span;
      if (rotors) for (const r of rotors) r.rotation.y = t * 6;

      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      resizeObserver.disconnect();
      io.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === frame) frame.removeChild(renderer.domElement);
    };
  }, [kind]);

  if (kind === "forge") {
    return (
      <div className="model-frame" style={height ? { height } : undefined}>
        <span className="model-frame__tag meta meta--accent">Assembly animation</span>
        <span className="model-frame__hint meta">Drag to orbit</span>
        <iframe
          src="/assets/hephaestus-forge-animation.html"
          title="Hephaestus Forge — assembly animation"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="model-frame" style={height ? { height } : undefined}>
      <span className="model-frame__tag meta meta--accent">{tag}</span>
      <span className="model-frame__hint meta">Drag to orbit</span>
      <div ref={frameRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
