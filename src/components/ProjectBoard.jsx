import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Letters from "./Letters";
import ExpandingCard from "./ExpandingCard";

// The Projects page as a board: cards laid on the same pitch the circuit
// ground behind them is drawn on, so filtering moves them from one set of
// pads to another rather than sliding them off the traces.
//
// Alignment is structural rather than something measured and corrected.
// Columns are a whole number of pitches wide, the gap is one pitch, and
// rows are one pitch tall with every cell the same whole number of them,
// so every card edge lands on the grid by construction.
//
// Opening lifts a card out of the flow rather than growing its cell. The
// first attempt grew the cell, and it was wrong three ways at once: the
// span was derived from the card's scrollHeight while the card's height
// came from the span, and since scrollHeight never reports less than
// clientHeight that loop could only ratchet upward — which is why a card
// never shrank again once opened. Growing the cell also reflowed every
// card after it on each frame of the transition, and grid-row cannot be
// transitioned, so the cell snapped while its contents eased. Out of
// flow, the grid never changes: nothing below moves, nothing is measured,
// and the only thing animating is the card itself.

// How many condensed cards build a real model, on top of whichever one is
// open. Every viewer is its own WebGLRenderer and browsers start
// discarding contexts past a dozen or so; the cards past this show the
// drawn footprint in .model-frame:empty instead, which is meant to look
// like an unpopulated pad rather than a hole.
const LIVE_CARDS = 6;

const STATUS_LABEL = {
  completed: "Completed",
  "in-progress": "In Progress",
  planned: "Planned",
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
  const fieldRef = useRef(null);

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

  // An open card grows to the right, so one near the right edge has to
  // grow the other way instead. Measured, but not the way the span was:
  // this reads the cell's place in a grid that opening does not change,
  // so there is no loop back into the thing being measured.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const open = field.querySelector(".board__cell.is-open");
    field.querySelectorAll(".is-flipped").forEach((el) => el.classList.remove("is-flipped"));
    if (!open) return;
    const cell = open.getBoundingClientRect();
    const bounds = field.getBoundingClientRect();
    const grown = cell.width * 2 + (parseFloat(getComputedStyle(field.querySelector(".board")?.parentElement || field).columnGap) || 0);
    if (cell.left + Math.max(grown, cell.width * 2) > bounds.right + 1) open.classList.add("is-flipped");
  }, [activeSlug, shown]);

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

      <div className="board__field" ref={fieldRef} onMouseLeave={() => canHover && setOpenSlug(null)}>
        <div className="board__pcb" aria-hidden="true" />

        <ul className="board__grid">
          {shown.map((p, i) => {
            const open = p.slug === activeSlug;
            return (
              <li
                key={p.slug}
                className={`board__cell${open ? " is-open" : ""}`}
                onMouseEnter={() => canHover && setOpenSlug(p.slug)}
                onFocus={() => setOpenSlug(p.slug)}
              >
                <ExpandingCard
                  entry={p}
                  to={`/projects/${p.slug}`}
                  open={open}
                  live={open || i < LIVE_CARDS}
                  side="is-right"
                  linkLabel="Full write-up"
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
