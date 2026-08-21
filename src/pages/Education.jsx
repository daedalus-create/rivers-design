import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import ModelViewer from "../components/LazyModelViewer";
import { education } from "../data/education";

export default function Education() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Education
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Bachelor of Science in Mechanical Dual Aerospace Engineering at Rensselaer Polytechnic Institute —
          expected graduation May 2026.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        {education.map((e) => (
          <Reveal as="article" className="project" key={e.slug}>
            <div className="project__head">
              <span className="project__num">{e.num}</span>
              <h2 className="project__title">
                <Link to={`/experience/${e.slug}`}>{e.org}</Link>
              </h2>
            </div>
            <p className="project__sub">{e.sub}</p>
            <p className="project__desc">{e.desc}</p>
            <ModelViewer kind={e.model} tag="3D Placeholder / Info & pics pending" />
            <ul className="specs">
              {e.specs.map((s) => (
                <li key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </li>
              ))}
            </ul>
            <Link className="link-arrow" to={`/experience/${e.slug}`}>
              Full write-up <span className="arr">&rarr;</span>
            </Link>
          </Reveal>
        ))}
      </section>

      <Divider
        to="/experience/classes"
        label="Classes"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />

      <section className="section--tight wrap">
        <Reveal as="h2" className="section-title">
          Highlighted Classes<span className="colon">:</span>
        </Reveal>
        <Reveal as="ul" className="specs" stagger={1}>
          <li>
            <span className="k">Manufacturing</span>
            <span className="v">Manufacturing Processes</span>
          </li>
          <li>
            <span className="k">Lab</span>
            <span className="v">Systems Laboratory 1</span>
          </li>
          <li>
            <span className="k">Capstone</span>
            <span className="v">Space Vehicle Design Capstone</span>
          </li>
          <li>
            <span className="k">Design</span>
            <span className="v">Numerical Design Optimization</span>
          </li>
          <li>
            <span className="k">Aerospace</span>
            <span className="v">Propulsion Systems</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
