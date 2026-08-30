import { useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Letters from "./Letters";
import SpecList from "./SpecList";
import ModelViewer from "./LazyModelViewer";
import { elbow, unscale } from "./connectors";

// The entry card shared by the Experience timeline and the Projects
// board: model beside the name when condensed, and when open the name
// goes across the top at display size while the model grows to fill the
// width beneath it.
//
// It lives here rather than in either page because the two were going to
// be the same forty lines twice, which is how the timeline's card and the
// board's would have drifted into looking subtly unalike — the same
// problem EntryCard was made to solve for the plain listings.
//
// What differs between the two callers is around the card, not in it:
// the timeline hangs it off a trunk on alternating sides, the board sits
// it in a grid cell. So this takes a `side` and otherwise knows nothing
// about either.

export default function ExpandingCard({
  entry,
  to,
  open,
  live,
  side = "is-right",
  linkLabel = "Full details",
  kindLabel,
}) {
  const moreRef = useRef(null);
  const branchRef = useRef(null);
  const bitPathRefs = useRef([]);
  const bitDotRefs = useRef([]);

  const bits = useMemo(() => {
    const list = [];
    if (entry.desc) list.push("desc");
    if (entry.specs && entry.specs.length) list.push("specs");
    if (linkLabel && to) list.push("link");
    return list;
  }, [entry.desc, entry.specs, linkLabel, to]);

  // The detail's own branch: the same trunk-and-elbow figure the page
  // outside is drawing, one level down. Only measured while open, since
  // a collapsed card has no laid-out detail to measure against.
  useLayoutEffect(() => {
    if (!open) return undefined;

    const draw = () => {
      const more = moreRef.current;
      const svg = branchRef.current;
      if (!more || !svg) return;

      const { rect: base, px } = unscale(more);
      const w = px(base.width);
      const h = px(base.height);
      if (!w || !h) return;
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      // The sub-trunk hangs on the inner edge — the side the card's own
      // wire arrived from — so the detail reads as hanging off the card
      // rather than starting again on its own.
      const channel = parseFloat(getComputedStyle(more).getPropertyValue("--xc-branch")) || 24;
      const x0 = side === "is-left" ? w - channel / 2 : channel / 2;

      bits.forEach((_, i) => {
        const dot = bitDotRefs.current[i];
        const path = bitPathRefs.current[i];
        if (!dot || !path) return;
        const r = dot.getBoundingClientRect();
        path.setAttribute(
          "d",
          elbow(x0, 0, px(r.left + r.width / 2 - base.left), px(r.top + r.height / 2 - base.top)),
        );
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    if (moreRef.current) ro.observe(moreRef.current);
    bitDotRefs.current.forEach((el) => el && ro.observe(el));
    const raf = requestAnimationFrame(draw);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [open, bits, side]);

  const title = to ? (
    <Link to={to}>
      <Letters text={entry.title} />
    </Link>
  ) : (
    entry.title
  );

  return (
    <div className={`xcard ${side}${open ? " is-open" : ""}`}>
      {/* Condensed this is [model][name over dates]. Open, it turns the
          corner: the name goes across the top and the model grows to fill
          the width under it. Same two elements either way, so the change
          is something CSS can move between rather than a swap between two
          different trees. */}
      <div className="xcard__top">
        <div className="xcard__thumb">
          {live && entry.model ? (
            <ModelViewer kind={entry.model} />
          ) : (
            <div className="model-frame" />
          )}
        </div>

        <div className="xcard__head" data-xc-head>
          <h3 className="xcard__title">{title}</h3>
          {(entry.date || entry.place || kindLabel) && (
            <p className="xcard__when meta">
              {entry.date && <span className="xcard__date">{entry.date}</span>}
              {entry.place && <span className="xcard__place">{entry.place}</span>}
              {kindLabel && <span className="xcard__kind">{kindLabel}</span>}
            </p>
          )}
          {entry.sub && <p className="xcard__sub">{entry.sub}</p>}
        </div>
      </div>

      {/* Kept mounted rather than unmounted so the open and close is
          something to animate, and so the text is in the document for a
          find-in-page. It is aria-hidden while closed and its link is out
          of the tab order, though: a link you cannot see is not one to
          land focus on. The title above stays focusable and goes to the
          same page, so nothing here is the only route to its own
          content. */}
      <div className="xcard__more" aria-hidden={!open} ref={moreRef}>
        {open && (
          <svg className="xcard__branch" aria-hidden="true" ref={branchRef}>
            <g>
              {bits.map((b, i) => (
                <path key={b} ref={(el) => (bitPathRefs.current[i] = el)} />
              ))}
            </g>
          </svg>
        )}

        <div className="xcard__more-inner">
          {bits.map((bit, i) => (
            <div className="xcard__bit" key={bit}>
              <span
                className="xcard__bit-dot"
                aria-hidden="true"
                ref={(el) => (bitDotRefs.current[i] = el)}
              />
              <div className="xcard__bit-body">
                {bit === "desc" && <p className="xcard__desc">{entry.desc}</p>}
                {bit === "specs" && <SpecList items={entry.specs} />}
                {bit === "link" && (
                  <Link className="link-arrow" to={to} tabIndex={open ? 0 : -1}>
                    <Letters text={linkLabel} /> <span className="arr">&rarr;</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
