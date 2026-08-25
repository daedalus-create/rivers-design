import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Letters from "./Letters";
import SpecList from "./SpecList";
import ModelViewer from "./LazyModelViewer";
import { elbow, unscale } from "./connectors";

// The work history as a timeline: one trunk down the page, a curved elbow
// out to each role, newest first.
//
// The elbow is the same figure the site menu draws, from the same module
// (connectors.js), so the two read as one idiom rather than two things
// that happen to both be curved. Same rule about the trunk, too: every
// entry's path redraws it, and the strokes are opaque with the fade on
// the wrapping <g>, so the overlapping runs do not stack into a darker
// line down the page.
//
// Entries open as they reach the reading band rather than on a click.
// Scrolling is the only input, so the page reads as one continuous
// movement instead of a list of things to go and poke at.
//
// The open entry's 3D viewer is mounted only while it is open, and this
// is not an optimisation to skip. Each viewer builds its own
// WebGLRenderer, and browsers cap live WebGL contexts somewhere around a
// dozen; ten of them mounted at once on this page would sit on that
// limit with ten animation loops running to draw nine things nobody is
// looking at. One at a time costs a rebuild on each change, which is
// cheap here because the geometry is generated rather than loaded.

// Where "being read" is, as a fraction of viewport height. Entries are
// ranked by distance from this line and the closest one opens. Above
// centre because an opening entry grows downward, and anchoring at the
// middle would push its own body off the bottom of the screen.
const FOCUS = 0.38;

// A newly opened entry changes the page height, which moves everything
// below it. Re-ranking on that reflow is what makes two neighbours trade
// the open state back and forth, so an entry has to beat the open one by
// this much (in pixels) to take it.
const HYSTERESIS = 64;

function useActiveIndex(count, containerRef) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    if (!count) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    let queued = 0;

    const pick = () => {
      queued = 0;
      const rows = container.querySelectorAll("[data-tl-row]");
      if (!rows.length) return;

      const line = window.innerHeight * FOCUS;
      let best = activeRef.current;
      let bestDist = Infinity;

      rows.forEach((row, i) => {
        const r = row.getBoundingClientRect();
        // Measure to the row's head, not its centre: the head is the
        // date and title, the part that stays put while the body opens
        // underneath it. Using the centre would mean an entry drifts as
        // it grows, and could unseat itself just by opening.
        const head = row.querySelector("[data-tl-head]");
        const y = head ? head.getBoundingClientRect().top : r.top;
        const dist = Math.abs(y - line);
        const penalty = i === activeRef.current ? -HYSTERESIS : 0;
        if (dist + penalty < bestDist) {
          bestDist = dist + penalty;
          best = i;
        }
      });

      if (best !== activeRef.current) {
        activeRef.current = best;
        setActive(best);
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (queued) cancelAnimationFrame(queued);
    };
  }, [count, containerRef]);

  return active;
}

export default function Timeline({ entries, basePath, linkLabel = "Full details", viewerTag }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const dotRefs = useRef([]);
  const active = useActiveIndex(entries.length, wrapRef);

  // Draw the trunk and its elbows against the laid-out boxes. Runs after
  // every open/close because an entry growing moves every dot below it.
  useLayoutEffect(() => {
    const draw = () => {
      const wrap = wrapRef.current;
      const svg = svgRef.current;
      if (!wrap || !svg) return;

      const { rect: base, px } = unscale(wrap);
      const w = px(base.width);
      const h = px(base.height);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const first = dotRefs.current[0];
      if (!first) return;
      const firstRect = first.getBoundingClientRect();
      // The trunk hangs from the first dot rather than the top of the
      // box, so it starts on the timeline instead of above it.
      const x0 = px(firstRect.left + firstRect.width / 2 - base.left);
      const y0 = px(firstRect.top + firstRect.height / 2 - base.top);

      entries.forEach((_, i) => {
        const dot = dotRefs.current[i];
        const path = pathRefs.current[i];
        if (!dot || !path) return;
        const r = dot.getBoundingClientRect();
        path.setAttribute(
          "d",
          elbow(x0, y0, px(r.left + r.width / 2 - base.left), px(r.top + r.height / 2 - base.top)),
        );
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    dotRefs.current.forEach((el) => el && ro.observe(el));
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [entries, active]);

  return (
    <div className="timeline" ref={wrapRef}>
      <svg className="timeline__wires" ref={svgRef} aria-hidden="true">
        <g>
          {entries.map((e, i) => (
            <path key={e.slug} ref={(el) => (pathRefs.current[i] = el)} />
          ))}
        </g>
      </svg>

      <ol className="timeline__list">
        {entries.map((entry, i) => {
          const open = i === active;
          return (
            <li
              className={`tl${open ? " is-open" : ""}`}
              key={entry.slug}
              data-tl-row
              aria-current={open ? "true" : undefined}
            >
              <span className="tl__dot" aria-hidden="true" ref={(el) => (dotRefs.current[i] = el)} />

              <div className="tl__body">
                <div className="tl__head" data-tl-head>
                  <p className="tl__when meta">
                    <span className="tl__date">{entry.date}</span>
                    {entry.place && <span className="tl__place">{entry.place}</span>}
                    {entry.kind === "education" && <span className="tl__kind">School</span>}
                  </p>
                  <h3 className="tl__title">
                    <Link to={`${basePath}/${entry.slug}`}>
                      <Letters text={entry.title} />
                    </Link>
                  </h3>
                  {entry.sub && <p className="tl__sub">{entry.sub}</p>}
                </div>

                {/* Kept mounted rather than unmounted so the open and
                    close is something to animate, and so the text is in
                    the document for a find-in-page. It is aria-hidden
                    while closed, though, and its link is out of the tab
                    order: a link you cannot see is not one to land focus
                    on. The title above stays focusable and goes to the
                    same detail page, so nothing here is the only route
                    to its own content. */}
                <div className="tl__more" aria-hidden={!open}>
                  <div className="tl__more-inner">
                    {entry.desc && <p className="tl__desc">{entry.desc}</p>}

                    {/* Mounted only while open — see the note at the top
                        about WebGL contexts. */}
                    {open && entry.model && <ModelViewer kind={entry.model} tag={viewerTag} height="clamp(240px, 34vw, 420px)" />}

                    <SpecList items={entry.specs} />
                    {linkLabel && (
                      <Link className="link-arrow" to={`${basePath}/${entry.slug}`} tabIndex={open ? 0 : -1}>
                        <Letters text={linkLabel} /> <span className="arr">&rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
