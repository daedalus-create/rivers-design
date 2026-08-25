import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ExpandingCard from "./ExpandingCard";
import { elbow, unscale } from "./connectors";

// The work history as a timeline: one trunk down the middle, a curved
// elbow out to each entry, alternating sides, newest first.
//
// The elbow is the same figure the site menu draws, from the same module
// (connectors.js), so the two read as one idiom rather than two things
// that happen to both be curved. Same rule about the trunk: every entry's
// path redraws it, and the strokes are opaque with the fade on a wrapping
// <g>, so overlapping runs do not stack into a darker line.
//
// An entry condensed is its model beside its name, with the dates under
// the name. Opened, the name goes over the top and the model grows to
// fill the width beneath it, and the detail unpacks below that, hung off
// a branch of the same line.

// Where "being read" is, as a fraction of viewport height. Entries rank
// by distance from this line and the closest opens. Above centre because
// an entry grows downward, and anchoring at the middle would push its own
// body off the bottom of the screen.
const FOCUS = 0.38;

// A newly opened entry changes the page height, which moves everything
// below it. Re-ranking on that reflow is what makes two neighbours trade
// the open state back and forth, so an entry has to beat the open one by
// this much (in pixels) to take it.
const HYSTERESIS = 64;

// How far either side of the open entry a model is actually built. Each
// viewer is its own WebGLRenderer and browsers start discarding contexts
// somewhere past a dozen, so ten live at once would sit on that limit
// running ten animation loops to draw eight models nobody is looking at.
// One either side means the next is already running by the time it is
// reached, so the swap is never caught happening.
const LIVE_RADIUS = 1;

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
        // Measure to the head, not the row's centre: the head is the name
        // and dates, the part that stays put while the body opens beneath
        // it. Using the centre would let an entry drift as it grows, and
        // unseat itself just by opening.
        const head = row.querySelector("[data-xc-head]");
        const y = (head || row).getBoundingClientRect().top;
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

// A pointer that cannot hover must not be able to latch an entry open: a
// tap on a touch screen fires mouseenter and then never fires the
// matching leave, so the entry would stay open until another was tapped.
function useCanHover() {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return canHover;
}

// One row. Owns the branch running from its dot down to each block of
// detail, which only exists while the row is open.
// One row: the dot the trunk lands on, and the card. `registerDot` hands
// the dot element up to the parent, because the trunk is measured across
// all the rows at once and so the element has to live in the parent's
// array rather than in a ref this row keeps to itself.
function Row({ entry, index, open, live, side, basePath, linkLabel, viewerTag, onHover, registerDot }) {
  return (
    <li
      className={`tl ${side}${open ? " is-open" : ""}`}
      data-tl-row
      aria-current={open ? "true" : undefined}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="tl__dot" aria-hidden="true" ref={registerDot} />

      <div className="tl__body">
        <ExpandingCard
          entry={entry}
          to={`${basePath}/${entry.slug}`}
          open={open}
          live={live}
          side={side}
          linkLabel={linkLabel}
          viewerTag={viewerTag}
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
  viewerTag,
  stacked: forceStacked = false,
  variant,
}) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const dotRefs = useRef([]);

  const scrolled = useActiveIndex(entries.length, wrapRef);
  const canHover = useCanHover();
  const [hovered, setHovered] = useState(null);

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

  // Hover wins while the pointer is on an entry; scroll decides the rest
  // of the time, and all of the time on a touch screen.
  const active = canHover && hovered !== null ? hovered : scrolled;

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

      const x0 = isStacked ? px(firstRect.left + firstRect.width / 2 - base.left) : w / 2;
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
    if (wrapRef.current) ro.observe(wrapRef.current);
    dotRefs.current.forEach((el) => el && ro.observe(el));
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [entries, active, isStacked]);

  return (
    <div
      className={`timeline${isStacked ? " is-stacked" : ""}${variant ? ` timeline--${variant}` : ""}`}
      ref={wrapRef}
      onMouseLeave={() => setHovered(null)}
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
            open={i === active}
            live={Math.abs(i - active) <= LIVE_RADIUS}
            side={isStacked || i % 2 !== 0 ? "is-right" : "is-left"}
            basePath={basePath}
            linkLabel={linkLabel}
            viewerTag={viewerTag}
            onHover={setHovered}
            registerDot={(el) => (dotRefs.current[i] = el)}
          />
        ))}
      </ol>
    </div>
  );
}
