import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { roles } from "../data/roles";

export default function WorkExcerpts() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Work Excerpts
        </Reveal>
      </section>

      <section className="section--tight wrap">
        {roles.map((r) => (
          <Reveal as="article" className="xp" id={r.slug} key={r.slug}>
            <div>
              <h2 className="xp__role">
                {r.org}
                <span style={{ color: "var(--accent)" }}>:</span>
              </h2>
              <p className="xp__org meta">{r.sub}</p>
              <p className="meta" style={{ marginTop: "var(--space-2)", color: "var(--ink-a45)" }}>
                Role / Dates — TBD
              </p>
            </div>
            <div className="xp__body">
              {r.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <ModelViewer kind={r.model} tag="Placeholder / Info & pics" height="clamp(240px, 34vw, 420px)" />
          </Reveal>
        ))}
      </section>
    </>
  );
}
