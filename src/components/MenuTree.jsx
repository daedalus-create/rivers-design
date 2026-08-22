import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ancestorsOf, childrenOf, nodeForPath, rootSections } from "../data/siteTree";
import Letters from "./Letters";

// Branching site menu. Opens as the three sections in a row; clicking one
// expands its pages to the right on curved connectors, and each of those
// can expand again, all the way down to individual project and role
// pages. Everything is laid out by flexbox — a node is [label][children],
// children stacked and vertically centred against their parent — so
// expanding anywhere reflows the rest naturally and the whole tree stays
// centred without any absolute positioning.
//
// The connectors are the one thing flexbox cannot give us, so they are
// measured after layout and written straight onto the <path> elements.
// Doing it imperatively rather than through state keeps a resize or an
// expansion from causing a second render pass just to draw a line.

// Radius of the elbow where a connector turns. The gutter it runs
// through is a CSS variable so it can scale with the viewport, and this
// is clamped against the actual run in connectorPath, so a generous
// value here simply means "as round as there is room for".
const CORNER = 22;

// The tree is scaled to fill the screen. A fixed type size cannot do
// this: the three collapsed sections use about 60% of the width, while
// the deepest branch (Experience > Work Excerpts > four roles) overruns
// it by 14% and pushes items off the left edge. So the whole thing is
// measured after layout and scaled to fit — up when it is small, down
// when a deep branch would otherwise overflow.
const MAX_FIT = 2.2;
const MIN_FIT = 0.5;
const FIT_MARGIN = 0.98; // the field's own padding is the breathing room
const REFIT_EVENT = "menu-refit";

/** Elbow from a parent's right edge to one child's left edge. */
function connectorPath(x0, y0, x1, y1) {
  if (Math.abs(y1 - y0) < 0.5) return `M${x0} ${y0} L${x1} ${y1}`;
  const midX = x0 + (x1 - x0) / 2;
  const dir = y1 > y0 ? 1 : -1;
  const r = Math.min(CORNER, Math.abs(y1 - y0) / 2, Math.abs(midX - x0), Math.abs(x1 - midX));
  return [
    `M${x0} ${y0}`,
    `L${midX - r} ${y0}`,
    `Q${midX} ${y0} ${midX} ${y0 + dir * r}`,
    `L${midX} ${y1 - dir * r}`,
    `Q${midX} ${y1} ${midX + r} ${y1}`,
    `L${x1} ${y1}`,
  ].join(" ");
}

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

      const base = wrap.getBoundingClientRect();
      // The tree is inside a scaled ancestor, so getBoundingClientRect
      // reports screen pixels while the SVG draws in layout pixels.
      // Recover the factor from this element rather than threading it
      // down as a prop: offsetWidth is the untransformed box, so the
      // ratio is exactly the scale in force here.
      const k = wrap.offsetWidth ? base.width / wrap.offsetWidth : 1;
      const px = (v) => v / k;

      const from = label.getBoundingClientRect();
      const x0 = px(from.right - base.left);
      const y0 = px(from.top + from.height / 2 - base.top);
      const w = px(base.width);
      const h = px(base.height);

      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      kids.forEach((_, i) => {
        const el = childRefs.current[i];
        const p = pathRefs.current[i];
        if (!el || !p) return;
        const to = el.getBoundingClientRect();
        p.setAttribute(
          "d",
          connectorPath(x0, y0, px(to.left - base.left), px(to.top + to.height / 2 - base.top)),
        );
      });
    };

    draw();
    // Re-draw whenever anything reflows: a deeper expansion, a window
    // resize, or the reveal transition settling. A change of scale does
    // NOT change any layout box, so ResizeObserver cannot see it — hence
    // the explicit refit event from the parent.
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
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
          {kids.map((k, i) => (
            <path key={k.node} ref={(el) => (pathRefs.current[i] = el)} />
          ))}
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
      if (applied !== null && Math.abs(applied - fit) < 0.004) return;
      applied = fit;
      tree.style.setProperty("--fit", String(fit));
      // connectors measure screen pixels, so they have to redraw at the
      // new scale; a transform changes no layout box, so nothing else
      // would tell them
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
    ro.observe(fieldRef.current);
    ro.observe(rootsRef.current);
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
            &larr; All sections
          </button>
        )}
      </nav>
    </div>
  );
}
