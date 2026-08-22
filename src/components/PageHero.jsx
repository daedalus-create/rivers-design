import Reveal from "./Reveal";

// The header every page opens with: a small breadcrumb line, the page
// title, and an optional lede. One component so the three never drift
// apart in spacing or order.
export default function PageHero({ eyebrow, title, lede, children }) {
  return (
    <section className="page-hero wrap">
      {eyebrow && (
        <Reveal as="p" className="meta meta--wide">
          {eyebrow}
        </Reveal>
      )}
      <Reveal as="h1" className="display" stagger={1}>
        {title}
      </Reveal>
      {lede && (
        <Reveal as="p" className="lede" stagger={2}>
          {lede}
        </Reveal>
      )}
      {children}
    </section>
  );
}
