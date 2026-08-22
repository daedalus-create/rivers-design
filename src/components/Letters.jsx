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

// A plain space would collapse between inline-blocks. Built from its
// char code so the source carries no invisible bytes.
const NBSP = String.fromCharCode(160);

export default function Letters({ text }) {
  const label = String(text);
  return (
    <>
      <span className="letters-sr">{label}</span>
      <span className="ch-set" aria-hidden="true">
        {[...label].map((ch, i) => (
          <span className="ch" style={{ "--i": i }} key={`${i}-${ch}`}>
            {ch === " " ? NBSP : ch}
          </span>
        ))}
      </span>
    </>
  );
}
