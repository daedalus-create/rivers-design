import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import ModelViewer from "../components/LazyModelViewer";
import { completedProjects } from "../data/projects";
import { roles } from "../data/roles";

export default function Home() {
  return (
    <>
      <section className="section wrap" id="idea" aria-label="Philosophy">
        <Reveal className="statement">
          <h2 className="statement__label">
            The Idea<span className="colon">:</span>
          </h2>
          <p className="statement__text">
            Engineer for function, design for form:
            <br />
            Focus on DFM, keep it simple,
            <br />
            but always leave room for soul.
          </p>
        </Reveal>
        <Reveal className="statement" stagger={1}>
          <h2 className="statement__label">
            The Dream<span className="colon">:</span>
          </h2>
          <p className="statement__text">
            Utility over profit, objects that matter:
            <br />
            A cleaner more sustainable tomorrow
            <br />
            where life isn&rsquo;t just getting through today.
          </p>
        </Reveal>
      </section>

      <Divider to="/projects" label="Projects" />

      <section className="section wrap" id="projects" aria-label="Projects">
        {completedProjects.map((p) => (
          <Reveal as="article" className="project" key={p.slug}>
            <div className="project__head">
              <span className="project__num">{p.num}</span>
              <h3 className="project__title">
                <Link to={`/projects/${p.slug}`}>{p.title}</Link>
              </h3>
            </div>
            <p className="project__sub">{p.sub}</p>
            <ModelViewer kind={p.model} />
            <ul className="specs">
              {p.specs.map((s) => (
                <li key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </section>

      <Divider to="/experience" label="Experience" iconLeft="/assets/divider-icon-3.svg" iconRight="/assets/divider-icon-2.svg" flip />

      <section className="section wrap" id="experience" aria-label="Experience">
        {roles.map((r) => (
          <Reveal as="article" className="project" key={r.slug}>
            <div className="project__head">
              <span className="project__num">{r.num}</span>
              <h3 className="project__title">
                <Link to={`/experience/work-excerpts#${r.slug}`}>{r.org}</Link>
              </h3>
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
            <Link className="link-arrow" to={`/experience/work-excerpts#${r.slug}`}>
              Full role details <span className="arr">&rarr;</span>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
