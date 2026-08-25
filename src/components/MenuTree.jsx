import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ancestorsOf, childrenOf, nodeForPath, rootSections } from "../data/siteTree";
import Letters from "./Letters";

// Branching site menu. Opens as a row of root sections; clicking one drops
// its pages in a list below it, and each of those can expand again the
// same way, all the way down to individual project and role pages. A node
// is [label] over [children] in a flex column, so expanding anywhere just
// grows that node's own height — flexbox reflows the rest of the tree
// around it, with nothing measured or absolutely positioned.

// The tree is scaled to fill the screen. A fixed type size cannot do
// this: the collapsed root row uses a fraction of the width, while a
// deep branch (Experience > Work Excerpts > four roles) grows tall
// enough to run past the bottom. So the whole thing is measured after
// layout and scaled to fit — up when it is small, down when an open
// branch would otherwise overflow.
const MAX_FIT = 2.2;
const MIN_FIT = 0.5;
const FIT_MARGIN = 0.98; // the field's own padding is the breathing room

function TreeNode({ node, expandedPath, depth, onToggle, onNavigate, currentNode }) {
  const kids = childrenOf(node.node);
  const isOpen = expandedPath[depth] === node.node;
  // Dim the siblings that were passed over on the way down, so the open
  // branch stands out. Anything at the frontier — the children just
  // revealed, which sit one level deeper than the last opened node — is
  // left bright, since those are the destinations being offered.
  const dimmed = depth < expandedPath.length && expandedPath[depth] !== node.node;

  const labelRef = useRef(null);
  const isLeaf = kids.length === 0;
  const isCurrent = currentNode === node.node;

  return (
    <div className={`tnode${isOpen ? " is-open" : ""}${dimmed ? " is-dim" : ""}`}>
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
          {kids.map((k) => (
            <div className="tnode__kid" key={k.node}>
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
