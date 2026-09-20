import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ExpandingCard from "./ExpandingCard";
import { elbow, unscale } from "./connectors";
import { useReveal } from "../hooks/useReveal";

// The work history as a timeline: one trunk down the middle, a curved
// elbow out to each entry, alternating sides, newest first.
//
// The elbow is the same figure the site menu draws, from the same module
// (connectors.js), so the two read as one idiom rather than two things
// that happen to both be curved. Same rule about the trunk: every entry's
// path redraws it, and the strokes are opaque with the fade on a wrapping
// <g>, so overlapping runs do not stack into a darker line.
//
// Every entry is open all the time now - it used to be one entry at a
// time, picked by scroll position or by hovering over a card, but both of
// those turned ordinary scrolling into a performance and correctness
// problem: a browser fires mouseenter/mouseleave whenever the element
// under the pointer changes, including when the page scrolls a row under
// a pointer that never moved, so a page where hovering opened a card had
// cards popping open and shut - each one potentially mounting a heavy
// model viewer - purely because it scrolled past wherever the mouse
// happened to be resting. The scroll-position version had its own cost:
// a rank-all-entries measurement on every scroll frame, plus a snap-to-
// top nudge that fought the visitor's own scrolling. Showing every card
// at once removes both: nothing decides what is "open" any more, so
// there is nothing left to recompute as the page scrolls. What replaces
// the old pop-open is a plain one-shot reveal as each entry first
// scrolls into view (see useReveal) - a CSS opacity/transform transition
// that costs nothing once it has played, rather than a per-frame scroll
// listener that runs for as long as the page is open.

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

// One row. Owns the branch running from its dot down to each block of
// detail. `registerDot` hands the dot element up to the parent, because
// the trunk is measured across all the rows at once and so the element
// has to live in the parent's array rather than in a ref this row keeps
// to itself.
function Row({ entry, index, live, side, basePath, linkLabel, registerDot }) {
  // The reveal goes on the card body, not this <li>: the dot above sits
  // on the trunk wire, whose path is measured (in the effect below) from
  // the dot's own on-screen position. Sliding the dot along with the
  // card would leave the wire pointing at the spot the dot started from
  // for the length of the transition, since the path isn't re-measured
  // frame by frame - it would visibly detach from its own dot while the
  // card animated in. Only the body needs to move.
  const [ref, visible] = useReveal();

  return (
    <li className={`tl ${side} is-open`} style={{ "--stagger-i": index % 4 }}>
      <span className="tl__dot" aria-hidden="true" ref={registerDot} />

      <div ref={ref} className={`tl__body card-reveal${visible ? " in" : ""}`}>
        <ExpandingCard
          entry={entry}
          to={`${basePath}/${entry.slug}`}
          open
          live={live}
          side={side}
          linkLabel={linkLabel}
          kindLabel={entry.kind === "education" ? "School" : undefined}
        />
      </div>
    </li>
  );
}

export default function Timeline({
  entries,
  basePath,
  linkLabel = "Full details",
  stacked: forceStacked = false,
  variant,
  // Extra breathing room between entries. The homepage passes this: its
  // cards run the full page width and open to a large, image-heavy
  // panel, so the default rhythm (tuned for the narrower, text-led
  // Experience page) reads as cramped there - the next entry's head sits
  // close enough to the one above it that scrolling between them feels
  // like one continuous block rather than distinct entries.
  roomy = false,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const dotRefs = useRef([]);

  // Which arrangement is on screen is decided here rather than in CSS,
  // and this is a reversal of how the trunk position used to be settled.
  // The reason is that the arrangement is not only a matter of style: an
  // entry's side determines which edge its detail branches off, so the
  // markup has to know it too. Splitting that decision between a media
  // query and a custom property read back out of the computed style left
  // two places that had to agree; one place that both the layout and the
  // markup read cannot disagree with itself.
  const narrow = useMediaQuery("(max-width: 860px)");
  const isStacked = forceStacked || narrow;

  useLayoutEffect(() => {
    const draw = () => {
      const wrap = wrapRef.current;
      const svg = svgRef.current;
      if (!wrap || !svg) return;

      // Every getBoundingClientRect below is read first and every
      // setAttribute write happens after, in two separate passes. They
      // used to alternate one dot at a time - measure, write the <path>,
      // measure the next dot, write again - and each write invalidates
      // layout, so every measurement after the first was forcing the
      // browser to redo it synchronously rather than reading back
      // something already known. On a long timeline (the homepage runs
      // two of these, one for projects and one for experience) that was
      // a forced synchronous layout per entry, on every mount, resize,
      // and dot-size change - real main-thread cost for a figure that
      // does not need to be recomputed one entry at a time.
      const { rect: base, px } = unscale(wrap);
      const w = px(base.width);
      const h = px(base.height);

      const first = dotRefs.current[0];
      if (!first) return;
      const firstRect = first.getBoundingClientRect();
      const x0 = isStacked ? px(firstRect.left + firstRect.width / 2 - base.left) : w / 2;
      const y0 = px(firstRect.top + firstRect.height / 2 - base.top);

      const dotRects = entries.map((_, i) => dotRefs.current[i]?.getBoundingClientRect());

      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      entries.forEach((_, i) => {
        const path = pathRefs.current[i];
        const r = dotRects[i];
        if (!path || !r) return;
        path.setAttribute(
          "d",
          elbow(x0, y0, px(r.left + r.width / 2 - base.left), px(r.top + r.height / 2 - base.top)),
        );
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    if (wrapRef.current) ro.observe(wrapRef.current);
    dotRefs.current.forEach((el) => el && ro.observe(el));
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [entries, isStacked]);

  return (
    <div
      className={`timeline${isStacked ? " is-stacked" : ""}${variant ? ` timeline--${variant}` : ""}${roomy ? " timeline--roomy" : ""}`}
      ref={wrapRef}
    >
      <svg className="timeline__wires" ref={svgRef} aria-hidden="true">
        <g>
          {entries.map((e, i) => (
            <path key={e.slug} ref={(el) => (pathRefs.current[i] = el)} />
          ))}
        </g>
      </svg>

      <ol className="timeline__list">
        {entries.map((entry, i) => (
          <Row
            key={entry.slug}
            entry={entry}
            index={i}
            /* Every entry builds its model. This was gated to one either
               side of the open entry to stay under the browser's ceiling on
               WebGL contexts, but that gate was local to this component, so
               the Projects board had a second one of its own and neither
               could see the other. modelBudget.js owns that decision for the
               whole page now, and it ranks by distance from the viewport
               rather than distance from a list index, so what gets held back
               is what you are not looking at. */
            live
            side={isStacked || i % 2 !== 0 ? "is-right" : "is-left"}
            basePath={basePath}
            linkLabel={linkLabel}
            registerDot={(el) => (dotRefs.current[i] = el)}
          />
        ))}
      </ol>
    </div>
  );
}
