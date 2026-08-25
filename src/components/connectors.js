// The drawn elbow shared by the site menu and the Experience timeline.
//
// Both draw the same figure: a vertical trunk with curved branches
// peeling off it to the right, each landing on a dot. They were going to
// be two copies of the same twenty lines, which is how the menu's corner
// radius and the timeline's would have drifted apart, so the geometry
// lives here once and both measure against it.
//
// Nothing here touches the DOM. It takes numbers and returns a path
// string, which is what lets the callers measure in whatever coordinate
// space they happen to be in.

// Radius of the turn out of the trunk. Clamped against the run actually
// available in `elbow`, so a generous value here just means "as round as
// there is room for" rather than a shape that overshoots its own box.
export const CORNER = 18;

/**
 * Trunk down from (x0, y0), then a curved turn out to (x1, y1).
 *
 * Turns either way. The menu only ever branches right, but the timeline
 * alternates around a centred trunk, so the direction comes from the
 * sign of the run rather than being assumed — which is the whole reason
 * this is one function and not two.
 *
 * Callers draw one of these per branch and let them share the trunk
 * rather than drawing the trunk once separately. That only looks right
 * if the overlapping runs do not compound, so the stroke must be opaque
 * and the fading done on a wrapping group — see `.tnode__wires g` and
 * `.timeline__wires g` in global.css.
 */
export function elbow(x0, y0, x1, y1) {
  const run = x1 - x0;
  if (Math.abs(run) < 0.5) return `M${x0} ${y0} L${x0} ${y1}`;
  const dir = run > 0 ? 1 : -1;
  const r = Math.min(CORNER, Math.abs(y1 - y0), Math.abs(run));
  return [
    `M${x0} ${y0}`,
    `L${x0} ${y1 - r}`,
    `Q${x0} ${y1} ${x0 + dir * r} ${y1}`,
    `L${x1} ${y1}`,
  ].join(" ");
}

/**
 * Screen pixels back to layout pixels for `el`.
 *
 * Both callers sit inside a scaled or transformed ancestor at some point,
 * so getBoundingClientRect reports screen pixels while the SVG draws in
 * layout pixels. offsetWidth is the untransformed box, so the ratio
 * between them is exactly the scale in force — which beats threading a
 * scale factor down through props that would then have to be kept
 * truthful by hand.
 */
export function unscale(el) {
  const rect = el.getBoundingClientRect();
  const k = el.offsetWidth ? rect.width / el.offsetWidth : 1;
  return { rect, k, px: (v) => v / k };
}
