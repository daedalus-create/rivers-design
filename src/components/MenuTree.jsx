import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ancestorsOf, childrenOf, nodeForPath, rootSections } from "../data/siteTree";

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

const CORNER = 10; // radius of the elbow where a connector turns
const GUTTER = 46; // horizontal space the connectors run through

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
      const from = label.getBoundingClientRect();
      const x0 = from.right - base.left;
      const y0 = from.top + from.height / 2 - base.top;

      svg.setAttribute("width", String(base.width));
      svg.setAttribute("height", String(base.height));
      svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);

      kids.forEach((_, i) => {
        const el = childRefs.current[i];
        const p = pathRefs.current[i];
        if (!el || !p) return;
        const to = el.getBoundingClientRect();
        p.setAttribute("d", connectorPath(x0, y0, to.left - base.left, to.top + to.height / 2 - base.top));
      });
    };

    draw();
    // Re-draw whenever anything reflows: a deeper expansion, a window
    // resize, or the reveal transition settling.
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    childRefs.current.forEach((el) => el && ro.observe(el));
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
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
        <span className="tnode__text">{node.label}</span>
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
        <div
          className="menu-tree__field"
          style={{ "--gutter": `${GUTTER}px` }}
          onClick={(e) => {
            if (e.target === e.currentTarget) collapse();
          }}
        >
          <div className="menu-tree__roots">
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
