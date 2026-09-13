import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Letters from "./Letters";
import ExpandingCard from "./ExpandingCard";

// The Projects page as a board: cards on a fixed column pitch, so filtering
// moves them from one set of cells to another rather than resizing the
// layout. Columns are a whole number of pitches wide and the gaps are one
// pitch, so every card edge lands on the grid by construction. Row heights
// come from the cards in them.
//
// There used to be a generated circuit-board texture behind all this, and
// the pitch existed to register the cards against it. The texture is gone
// for being noise, and the pitch stayed, because keeping fourteen cards of
// differing content on one grid is worth a unit of its own.
//
// Opening a card grows it and moves the cards after it along. Two earlier
// versions of that are worth recording, because the safe way to do it is
// not the obvious one:
//
//   1. The first grew the cell, with the row span derived from the card's
//      scrollHeight while the card's height came from the span. Since
//      scrollHeight never reports less than clientHeight, that loop could
//      only ratchet upward, which is why a card never shrank again once
//      opened.
//   2. The second avoided the loop by lifting the open card out of the grid
//      altogether, absolutely positioned above its neighbours. The grid did
//      then hold still — but an expanded card covered the cards around it
//      and cut their titles off, which is the complaint that got us here.
//
// What makes growing the cell safe now is that nothing derives a number
// from the card. The open cell spans the full width of the grid, and the
// grid's rows are auto-sized, so its row is as tall as the card in it
// because that is what an auto row means, not because anything measured it.
// Nothing to feed back, and nothing to get wrong at an edge.

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

  // The cards slide to their new places rather than snapping there.
  //
  // Nothing about a grid reflow is animatable: grid-column is not a
  // transitionable property, an auto row's height is not either, and a grid
  // item's position is decided by the grid rather than by anything a
  // transition can reach. So the movement is animated after the fact, the
  // way this has to be done — the FLIP idea. Read where every card was,
  // let the reflow happen, read where every card is now, then translate
  // each one back to where it started and animate that offset away. What
  // you see is the card travelling; what the browser laid out is only ever
  // the final position.
  //
  // This measures, but it is not the measuring loop the two earlier versions
  // of this component fell into. A transform has no effect on layout, so
  // nothing read here can change what is read next time. That is the whole
  // reason it is a transform and not a top/left.
  //
  // Positions are keyed by slug and taken from offsetTop/offsetLeft.
  // Slug, because filtering changes which cards exist and an index would
  // silently compare one card against a different one. Offsets rather than
  // getBoundingClientRect, because those are relative to the field and so
  // cannot turn a page scroll into a phantom delta.
  const spotsRef = useRef(new Map());

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const cells = [...field.querySelectorAll(".board__cell")];
    const before = spotsRef.current;
    const after = new Map();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const cell of cells) {
      const slug = cell.dataset.slug;
      const spot = { x: cell.offsetLeft, y: cell.offsetTop };
      after.set(slug, spot);

      const was = before.get(slug);
      // No previous position means the card has just been filtered in, and
      // there is nowhere to travel from.
      if (!was || still) continue;

      const dx = was.x - spot.x;
      const dy = was.y - spot.y;
      if (!dx && !dy) continue;

      // Mouse across a board is a stream of these, so an animation still
      // running is replaced rather than fought with.
      for (const running of cell.getAnimations()) running.cancel();
      cell.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }

    spotsRef.current = after;
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
        <ul className="board__grid">
          {shown.map((p) => {
            const open = p.slug === activeSlug;
            return (
              <li
                key={p.slug}
                data-slug={p.slug}
                className={`board__cell${open ? " is-open" : ""}`}
                onMouseEnter={() => canHover && setOpenSlug(p.slug)}
                onFocus={() => setOpenSlug(p.slug)}
              >
                <ExpandingCard
                  entry={p}
                  to={`/projects/${p.slug}`}
                  open={open}
                  /* Every card builds its real model, not just the first
                     handful. A board where six thumbnails move and the rest
                     are empty frames reads as broken rather than as
                     restraint, and each viewer already parks its render
                     loop when it scrolls out of view, so the cost of the
                     ones you cannot see is a context, not a frame. */
                  live
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
