import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { completedProjects } from "../data/projects";

export default function ProjectsCompleted() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Projects
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Completed
        </Reveal>
      </section>

      <section className="section--tight wrap">
        {completedProjects.map((p) => (
          <Reveal as="article" className="project" key={p.slug}>
            <div className="project__head">
              <span className="project__num">{p.num}</span>
              <h2 className="project__title">
                <Link to={`/projects/${p.slug}`}>{p.title}</Link>
              </h2>
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
            <Link className="link-arrow" to={`/projects/${p.slug}`}>
              Full write-up <span className="arr">&rarr;</span>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
