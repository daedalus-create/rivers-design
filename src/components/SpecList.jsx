import Reveal from "./Reveal";

// A key/value table. Used for an entry's specs and, on education, for
// its highlighted classes — same shape, so the same component.
export default function SpecList({ items, label, reveal = false, stagger }) {
  if (!items || !items.length) return null;
  const list = (
    <ul className="specs">
      {items.map((s) => (
        <li key={s.k}>
          <span className="k">{s.k}</span>
          <span className="v">{s.v}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {label && <p className="meta specs__label">{label}</p>}
      {reveal ? <Reveal stagger={stagger}>{list}</Reveal> : list}
    </>
  );
}
