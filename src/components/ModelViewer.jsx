import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BUILDERS, buildConcept } from "./modelBuilders";
import { claimContext } from "./modelBudget";

// 3D placeholder viewers. Each `kind` names a builder in
// modelBuilders.js. Swap a builder's output for a GLTF load (three's
// GLTFLoader) as real CAD exports arrive — see README.
//
// No caption. These used to carry a "3D Placeholder / ..." label and a
// "Drag to orbit" hint on every viewer on the site, which between them
// said the same two things twenty-four times over. The forge keeps its
// own label because that one names what is actually playing.

export default function ModelViewer({ kind = "concept", height }) {
  const frameRef = useRef(null);
  const hostRef = useRef(null);

  // Whether this viewer currently holds one of the page's WebGL contexts.
  // See modelBudget.js: there are more viewers on the Projects board than a
  // browser will give contexts for, so they are handed to whichever viewers
  // are nearest the middle of the screen and taken back on scroll.
  const [hasContext, setHasContext] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (kind === "forge" || !host) return undefined;
    return claimContext(host, setHasContext);
  }, [kind]);

  useEffect(() => {
    if (kind === "forge" || !hasContext) return undefined;
    const frame = frameRef.current;
    if (!frame) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(2.6, 1.6, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    frame.appendChild(renderer.domElement);

    const model = (BUILDERS[kind] || buildConcept)();
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

    const anims = model.userData.anims || [];
    // Captured before the loop: `orbit` sweeps x/z, so it needs the
    // height the builder placed the object at, not the value it wrote
    // on the previous frame.
    const orbitY = new Map(anims.filter((a) => a.t === "orbit").map((a) => [a, a.obj.position.y]));

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      resize();
      timer.update();
      const t = timer.getElapsed();
      model.rotation.y = t * 0.25;

      for (const a of anims) {
        if (a.t === "spin") {
          a.obj.rotation[a.axis] = t * a.speed;
        } else if (a.t === "shuttle") {
          a.obj.position[a.axis] = Math.sin(t * a.speed + a.phase) * a.span;
        } else if (a.t === "orbit") {
          const ang = t * a.speed + a.phase;
          a.obj.position.set(Math.cos(ang) * a.radius, orbitY.get(a), Math.sin(ang) * a.radius);
        }
      }

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
  }, [kind, hasContext]);

  if (kind === "forge") {
    return (
      <div className="model-frame" style={height ? { height } : undefined}>
        <span className="model-frame__tag meta meta--accent">Assembly animation</span>
        <iframe
          src="/assets/hephaestus-forge-animation.html"
          title="G.A.S. [Core XY System] assembly animation"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    // The inner box only exists while this viewer holds a context, so a
    // waiting frame is genuinely empty and picks up the hatched
    // .model-frame:empty placeholder. Left in place it would be a bare
    // bordered box, which reads as a broken viewer rather than a pending
    // one. The ref is safe: hasContext flips first, the box renders, and
    // only then does the effect below look for it.
    <div className="model-frame" ref={hostRef} style={height ? { height } : undefined}>
      {hasContext && <div ref={frameRef} style={{ width: "100%", height: "100%" }} />}
    </div>
  );
}
