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

export default function ModelViewer({ kind = "concept", height, open = false }) {
  const frameRef = useRef(null);
  const hostRef = useRef(null);
  const forgeFrameRef = useRef(null);
  const forgeHostRef = useRef(null);

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

  // The forge iframe renders a full WebGL scene every frame for as long
  // as it's mounted, which is real main-thread work competing with the
  // parent page's own - including whatever it's doing to keep scrolling
  // smooth. Every card is shown open all the time now (see Timeline.jsx),
  // so this iframe mounts once, on page load, and stays mounted for as
  // long as its section is on the page - there's no more "closed" state
  // to fall back to. Two things gate whether it actually renders a
  // frame: whether the page is scrolling right now, and whether the
  // viewer is anywhere near the viewport at all. Either one true is
  // enough to pause it.
  useEffect(() => {
    if (kind !== "forge" || !open) return undefined;

    let idleTimer = 0;
    // Starts true, not false: on a page long enough to have this card
    // off-screen at load, the visitor got here by scrolling, and by the
    // time this effect's own listener is registered that scroll is
    // already in the past - treating it as "not scrolling" until a new
    // scroll event happens to land would let the ready-handshake below
    // wave the iframe through to render while that same gesture is
    // still in flight.
    let scrolling = true;
    let visible = false;

    const post = () => {
      const win = forgeFrameRef.current?.contentWindow;
      if (win) win.postMessage({ type: "forge-scroll", scrolling: scrolling || !visible }, "*");
    };

    const onScroll = () => {
      scrolling = true;
      // Posted on every tick, not just the first of a scroll gesture:
      // this effect's own mount can race the first scroll event, so a
      // postMessage that only fired on the leading edge could miss it. A
      // postMessage is cheap next to the render it's saving.
      post();
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        scrolling = false;
        post();
      }, 220);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        post();
      },
      { rootMargin: "200px 0px" },
    );
    if (forgeHostRef.current) io.observe(forgeHostRef.current);

    // The iframe starts paused on its own (see hephaestus-forge-
    // animation.html) rather than waiting on a message that would race
    // its own load. It announces itself once its listener is actually
    // registered, which is when it's safe to tell it the real state
    // instead of the two of them silently disagreeing until the next
    // scroll or visibility change happens to fire.
    const onMessage = (e) => {
      if (e.data?.type === "forge-ready" && e.source === forgeFrameRef.current?.contentWindow) {
        post();
      }
    };
    window.addEventListener("message", onMessage);
    idleTimer = window.setTimeout(() => {
      scrolling = false;
      post();
    }, 220);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("message", onMessage);
      io.disconnect();
      window.clearTimeout(idleTimer);
    };
  }, [kind, open]);

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
    // The forge is a full animation loop running inside its own document,
    // not a WebGL context this component can budget the way it does the
    // others below - nothing here stops it running for as long as it's
    // mounted. Every card is shown open all the time (see Timeline.jsx),
    // so this mounts once on page load rather than toggling with a card,
    // and the effect above is what keeps it from costing anything while
    // it's scrolled out of view or the page itself is mid-scroll.
    return (
      <div className="model-frame" ref={forgeHostRef} style={height ? { height } : undefined}>
        <span className="model-frame__tag meta meta--accent">Assembly animation</span>
        {open && (
          <iframe
            ref={forgeFrameRef}
            src="/assets/hephaestus-forge-animation.html"
            title="G.A.S. [Core XY System] assembly animation"
            loading="lazy"
          />
        )}
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
