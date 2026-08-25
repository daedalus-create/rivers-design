import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Letters from "./Letters";
import ExpandingCard from "./ExpandingCard";

// The Projects page as a board: cards laid on the same pitch the circuit
// ground behind them is drawn on, so filtering moves them from one set of
// pads to another rather than sliding them off the traces.
//
// Alignment is structural rather than something measured and corrected.
// Columns are a whole number of pitches wide, the gap is one pitch, and
// rows are one pitch tall with each card spanning a whole number of them,
// so every card edge lands on the grid by construction. There is no code
// here keeping the cards and the board in step; the arithmetic does it.

// Fallback span, used for the frame before a card has been measured.
const SPAN_FALLBACK = 4;

// How many pitch-rows a card of this height needs, always rounded up so
// the content never meets the bottom edge, and always a whole number so
// the cell lands on the grid. Measuring rather than assuming a fixed
// span: cards carry different numbers of spec rows, and a span guessed
// high enough for the tallest would leave a hole under every other one,
// while a span guessed for the average would clip the rest.
function spanFor(height, pitch) {
  if (!height || !pitch) return SPAN_FALLBACK;
  return Math.max(SPAN_FALLBACK, Math.ceil((height + pitch) / pitch));
}

const STATUS_LABEL = {
  completed: "Completed",
  "in-progress": "In Progress",
  planned: "Planned",
};

const STATUS_TAG = {
  completed: "3D Placeholder / Model pending",
  "in-progress": "3D Placeholder / In progress",
  planned: "3D Placeholder / Concept",
};

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

export default function ProjectBoard({ projects }) {
  const [filter, setFilter] = useState("all");
  const [openSlug, setOpenSlug] = useState(null);
  const canHover = useCanHover();
  const gridRef = useRef(null);
  const cellRefs = useRef(new Map());

  // Filters are built from the data rather than listed here, so a status
  // or tag that exists in the sheet shows up without anyone remembering
  // to add a button for it. `tags` is optional and currently unused —
  // fill the column in content/projects.csv and its groupings appear.
  const groups = useMemo(() => {
    const statuses = [];
    for (const p of projects) {
      if (p.status && !statuses.includes(p.status)) statuses.push(p.status);
    }
    const tags = [];
    for (const p of projects) {
      for (const t of p.tags || []) if (!tags.includes(t)) tags.push(t);
    }
    return [
      { key: "all", label: "Everything", count: projects.length },
      ...statuses.map((s) => ({
        key: `status:${s}`,
        label: STATUS_LABEL[s] || s,
        count: projects.filter((p) => p.status === s).length,
      })),
      ...tags.map((t) => ({
        key: `tag:${t}`,
        label: t,
        count: projects.filter((p) => (p.tags || []).includes(t)).length,
      })),
    ];
  }, [projects]);

  const shown = useMemo(() => {
    if (filter === "all") return projects;
    const [kind, value] = filter.split(":");
    if (kind === "status") return projects.filter((p) => p.status === value);
    return projects.filter((p) => (p.tags || []).includes(value));
  }, [projects, filter]);

  // A card filtered out while open should not stay open behind the
  // filter. Derived rather than reset in an effect: the effect version
  // renders once with a stale open card and then again to clear it, and
  // this question already has an answer in what is on screen.
  const activeSlug = openSlug && shown.some((p) => p.slug === openSlug) ? openSlug : null;

  // Each cell spans as many whole pitch-rows as its card actually needs.
  // Written straight to the element rather than held in state: this runs
  // on every open, close, filter and resize, and none of it should cause
  // a React render of its own.
  useLayoutEffect(() => {
    const measure = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const pitch = parseFloat(getComputedStyle(grid).gridAutoRows) || 44;
      cellRefs.current.forEach((cell) => {
        if (!cell || !cell.isConnected) return;
        const card = cell.firstElementChild;
        if (!card) return;
        cell.style.setProperty("--span", String(spanFor(card.scrollHeight, pitch)));
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    cellRefs.current.forEach((cell) => {
      const card = cell?.firstElementChild;
      if (card) ro.observe(card);
    });
    const raf = requestAnimationFrame(measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [shown, activeSlug]);

  return (
    <div className="board">
      <div className="board__filters" role="group" aria-label="Filter projects">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`chip${filter === g.key ? " is-on" : ""}`}
            aria-pressed={filter === g.key}
            onClick={() => setFilter(g.key)}
          >
            <Letters text={g.label} />
            <span className="chip__count">{g.count}</span>
          </button>
        ))}
      </div>

      <p className="board__count meta" aria-live="polite">
        {shown.length} {shown.length === 1 ? "project" : "projects"}
      </p>

      <div className="board__field" ref={gridRef} onMouseLeave={() => canHover && setOpenSlug(null)}>
        <div className="board__pcb" aria-hidden="true" />

        <ul className="board__grid">
          {shown.map((p, i) => {
            const open = p.slug === activeSlug;
            return (
              <li
                key={p.slug}
                className="board__cell"
                ref={(el) => {
                  if (el) cellRefs.current.set(p.slug, el);
                  else cellRefs.current.delete(p.slug);
                }}
                onMouseEnter={() => canHover && setOpenSlug(p.slug)}
                onFocus={() => setOpenSlug(p.slug)}
              >
                <ExpandingCard
                  entry={p}
                  to={`/projects/${p.slug}`}
                  open={open}
                  live={open || i < 2}
                  side="is-right"
                  linkLabel="Full write-up"
                  viewerTag={STATUS_TAG[p.status]}
                  kindLabel={STATUS_LABEL[p.status]}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
