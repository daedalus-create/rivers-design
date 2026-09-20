import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ancestorsOf, childrenOf, nodeForPath, rootSections } from "../data/siteTree";
import Letters from "./Letters";
import { elbow, unscale } from "./connectors";

// Branching site menu. Opens as a row of root sections; clicking one drops
// its pages in a list below it, and each of those can expand again the
// same way, all the way down to individual project and role pages. A node
// is [label] over [children] in a flex column, so expanding anywhere just
// grows that node's own height — flexbox reflows the rest of the tree
// around it, with nothing measured or absolutely positioned.
//
// The one thing flexbox cannot give us is the connectors: a trunk
// descending from the parent label with a curved elbow peeling off to
// each child's dot. Those are measured after layout and written straight
// onto the <path> elements. Doing it imperatively rather than through
// state keeps a resize or an expansion from causing a second render pass
// just to draw a line.

// The tree is scaled to fill the screen. A fixed type size cannot do
// this: the collapsed root row uses a fraction of the width, while a
// deep branch (Experience > Work Excerpts > four roles) grows tall
// enough to run past the bottom. So the whole thing is measured after
// layout and scaled to fit — up when it is small, down when an open
// branch would otherwise overflow.
const MAX_FIT = 2.2;
const MIN_FIT = 0.5;
const FIT_MARGIN = 0.98; // the field's own padding is the breathing room
const REFIT_EVENT = "menu-refit";

// How far in from the parent label's left edge the trunk descends, in
// layout pixels, so the wire reads as growing out of the label.
const TRUNK_INSET = 10;

function TreeNode({ node, expandedPath, depth, onToggle, onNavigate, currentNode }) {
  const kids = childrenOf(node.node);
  const isOpen = expandedPath[depth] === node.node;
  // Dim the siblings that were passed over on the way down, so the open
  // branch stands out. Anything at the frontier — the children just
  // revealed, which sit one level deeper than the last opened node — is
  // left bright, since those are the destinations being offered.
  const dimmed = depth < expandedPath.length && expandedPath[depth] !== node.node;

  const wrapRef = useRef(null);
  const labelRef = useRef(null);
  const childRefs = useRef([]);
  const pathRefs = useRef([]);
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    if (!isOpen || !kids.length) return undefined;

    const draw = () => {
      const wrap = wrapRef.current;
      const label = labelRef.current;
      const svg = svgRef.current;
      if (!wrap || !label || !svg) return;

      // Reads batched before writes - see the identical note on
      // Timeline.jsx's draw(), which had the same one-child-at-a-time
      // measure/write alternation forcing a synchronous layout per kid.
      const { rect: base, px } = unscale(wrap);
      const from = label.getBoundingClientRect();
      const x0 = px(from.left - base.left) + TRUNK_INSET;
      const y0 = px(from.bottom - base.top);
      const w = px(base.width);
      const h = px(base.height);
      const kidRects = kids.map((_, i) => childRefs.current[i]?.getBoundingClientRect());

      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      kids.forEach((_, i) => {
        const path = pathRefs.current[i];
        const to = kidRects[i];
        if (!path || !to) return;
        path.setAttribute(
          "d",
          elbow(x0, y0, px(to.left - base.left), px(to.top + to.height / 2 - base.top)),
        );
      });
    };

    draw();
    // Redraw whenever anything reflows: a deeper expansion, a window
    // resize, or the reveal transition settling. A change of scale does
    // NOT change any layout box, so ResizeObserver cannot see it — hence
    // the explicit refit event from the parent.
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    childRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener(REFIT_EVENT, draw);
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      window.removeEventListener(REFIT_EVENT, draw);
      cancelAnimationFrame(raf);
    };
  }, [isOpen, kids, expandedPath]);

  const isLeaf = kids.length === 0;
  const isCurrent = currentNode === node.node;

  return (
    <div className={`tnode${isOpen ? " is-open" : ""}${dimmed ? " is-dim" : ""}`} ref={wrapRef}>
      {isOpen && kids.length > 0 && (
        <svg className="tnode__wires" ref={svgRef} aria-hidden="true">
          <g>
            {kids.map((k, i) => (
              <path key={k.node} ref={(el) => (pathRefs.current[i] = el)} />
            ))}
          </g>
        </svg>
      )}

      <Link
        ref={labelRef}
        className={`tnode__label${isCurrent ? " is-current" : ""}`}
        to={node.href}
        aria-current={isCurrent ? "page" : undefined}
        aria-expanded={isLeaf ? undefined : isOpen}
        onClick={(e) => {
          // A section opens on the first click and navigates on the
          // second, so the branch can be explored without leaving the
          // page. Leaves navigate straight away.
          if (!isLeaf && !isOpen) {
            e.preventDefault();
            onToggle(depth, node.node);
            // Children land below this label rather than beside it, so
            // the field's own scroll has to be nudged for them to come
            // into view. Two rAFs: one for React to commit the newly
            // expanded kids, one for layout to settle before measuring
            // where to scroll.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                labelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
              });
            });
            return;
          }
          onNavigate();
        }}
      >
        <span className="tnode__dot" aria-hidden="true" />
        <span className="tnode__text">
          <Letters text={node.label} />
        </span>
      </Link>

      {isOpen && kids.length > 0 && (
        <div className="tnode__kids">
          {kids.map((k, i) => (
            <div className="tnode__kid" key={k.node} ref={(el) => (childRefs.current[i] = el)}>
              <TreeNode
                node={k}
                expandedPath={expandedPath}
                depth={depth + 1}
                onToggle={onToggle}
                onNavigate={onNavigate}
                currentNode={currentNode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuTree({ open, onClose }) {
  const location = useLocation();
  const [expandedPath, setExpandedPath] = useState([]);
  const roots = rootSections();
  const current = nodeForPath(location.pathname);

  const toggle = useCallback((depth, node) => {
    // Opening a node replaces anything that was open at or below its
    // level, so only one branch is ever expanded at a time.
    setExpandedPath((prev) => [...prev.slice(0, depth), node]);
  }, []);

  const collapse = useCallback(() => setExpandedPath([]), []);

  // Opening the menu reveals the branch containing the current page, so
  // the reader starts from where they already are rather than the root.
  // Adjusted during render rather than in an effect: an effect would let
  // the menu paint collapsed for a frame before snapping open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setExpandedPath(open && current ? ancestorsOf(current.node) : []);
  }

  // Scale the tree to fill the field. Measured off offsetWidth/Height,
  // which are the untransformed boxes, so the reading does not feed back
  // into the scale it produces. Written straight to a CSS variable rather
  // than held in state — this runs on every expand and every resize, and
  // none of it needs to cause a re-render.
  const fieldRef = useRef(null);
  const rootsRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    let queued = 0;
    let applied = null;

    const measureAndApply = () => {
      queued = 0;
      const field = fieldRef.current;
      const tree = rootsRef.current;
      if (!field || !tree || !tree.offsetWidth || !tree.offsetHeight) return;

      const styles = getComputedStyle(field);
      const availW = field.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const availH = field.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);

      const fit =
        Math.round(
          Math.max(
            MIN_FIT,
            Math.min(MAX_FIT, (availW / tree.offsetWidth) * FIT_MARGIN, (availH / tree.offsetHeight) * FIT_MARGIN),
          ) * 1000,
        ) / 1000;

      // Writing the same-ish value again restarts the transform
      // transition from wherever it had got to, which is what made
      // expanding look jittery: the effect re-ran for the new path AND
      // the observer fired for the new layout, so the scale animation
      // was interrupted and re-launched mid-flight. Only write a real
      // change, and only once per frame.
      if (applied === null || Math.abs(applied - fit) >= 0.004) {
        applied = fit;
        tree.style.setProperty("--fit", String(fit));
      }

      // Told on every pass, not only when the scale moved. Whether to
      // rewrite --fit and whether the connectors are stale are separate
      // questions, and the early return above answers the first one: a
      // pass that decides the scale is unchanged would otherwise also
      // suppress the redraw. The wires measure screen pixels, and a
      // transform changes no layout box, so this event is the only thing
      // that can tell them a rescale happened. Coalesced to one pass per
      // frame already, so the extra draw is cheap.
      window.dispatchEvent(new Event(REFIT_EVENT));
    };

    // Coalesce: an expansion changes the layout and the observer and the
    // effect both want to react to it. One measurement per frame.
    const refit = () => {
      if (queued) return;
      queued = requestAnimationFrame(measureAndApply);
    };

    measureAndApply();
    const ro = new ResizeObserver(refit);
    // Guarded: observe() throws on null, and the refs are only populated
    // once the overlay has rendered.
    [fieldRef.current, rootsRef.current].forEach((el) => el && ro.observe(el));
    return () => {
      ro.disconnect();
      if (queued) cancelAnimationFrame(queued);
    };
  }, [open, expandedPath]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      // step out one level at a time, then close
      setExpandedPath((prev) => {
        if (prev.length) return prev.slice(0, -1);
        onClose();
        return prev;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`menu-overlay${open ? " open" : ""}`} id="site-menu" aria-hidden={!open}>
      <nav className="menu-tree" aria-label="Site menu">
        {/* Contour drawing behind the tree. Decorative only, so it is
            hidden from assistive tech and takes no pointer events. */}
        <div className="menu-backdrop" aria-hidden="true" />
        <div
          className="menu-tree__field"
          ref={fieldRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) collapse();
          }}
        >
          <div className="menu-tree__roots" ref={rootsRef}>
            {roots.map((r) => (
              <TreeNode
                key={r.node}
                node={r}
                expandedPath={expandedPath}
                depth={0}
                onToggle={toggle}
                onNavigate={onClose}
                currentNode={current?.node}
              />
            ))}
          </div>
        </div>

        {expandedPath.length > 0 && (
          <button className="menu-tree__back meta" type="button" onClick={collapse}>
            &larr; <Letters text="All sections" />
          </button>
        )}
      </nav>
    </div>
  );
}
