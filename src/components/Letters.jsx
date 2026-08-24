// Splits a label into one span per character so it can animate letter by
// letter on hover. Each span carries its index as --i, which CSS turns
// into a transition delay, so a word lifts left to right instead of
// jumping as a block (see the `.ch` rules in global.css).
//
// Used for any word you can hover to move to a page.
//
// Accessibility: the split spans are hidden from assistive tech and the
// whole string is exposed once, visually hidden, alongside them. Reading
// a link letter by letter is a real failure mode when text is chopped
// into inline-blocks, and hiding the pieces without providing the whole
// would leave the link with no accessible name at all.
//
// That duplicate copy is excluded from text selection, or selecting a
// title would copy it twice.
//
// Grouped one `.ch-set` per word, joined by a real (breakable) space
// text node rather than one `.ch-set` for the whole phrase — a single
// inline-flex box has no line-break opportunity inside it at all, so a
// multi-word label like "Work in Progress" was one unbreakable run that
// could run off the edge of a narrow container with nowhere to wrap.
// The --i index still counts continuously across the whole phrase, so
// the stagger reads as one sweep regardless of the word breaks.
export default function Letters({ text }) {
  const label = String(text);
  const words = label.split(" ");
  let i = 0;
  const nodes = [];
  words.forEach((word, wi) => {
    if (wi > 0) {
      nodes.push(" ");
      i += 1;
    }
    nodes.push(
      <span className="ch-set" key={`w${wi}`}>
        {[...word].map((ch) => {
          const node = (
            <span className="ch" style={{ "--i": i }} key={i}>
              {ch}
            </span>
          );
          i += 1;
          return node;
        })}
      </span>,
    );
  });

  return (
    <>
      <span className="letters-sr">{label}</span>
      <span aria-hidden="true">{nodes}</span>
    </>
  );
}
