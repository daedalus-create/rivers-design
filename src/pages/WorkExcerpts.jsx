import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { roles } from "../data/roles";
import Letters from "../components/Letters";

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
          <Reveal as="article" className="project" key={r.slug}>
            <div className="project__head">
              <span className="project__num">{r.num}</span>
              <h2 className="project__title">
                <Link to={`/experience/${r.slug}`}><Letters text={r.org} /></Link>
              </h2>
            </div>
            <p className="project__sub">{r.sub}</p>
            <p className="project__desc">{r.desc}</p>
            <ModelViewer kind={r.model} tag="3D Placeholder / Info & pics pending" />
            <ul className="specs">
              {r.specs.map((s) => (
                <li key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </li>
              ))}
            </ul>
            <Link className="link-arrow" to={`/experience/${r.slug}`}>
              <Letters text="Full write-up" /> <span className="arr">&rarr;</span>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
