import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import ModelViewer from "../components/LazyModelViewer";
import { education } from "../data/education";
import Letters from "../components/Letters";

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
          A B.S. in Mechanical Dual Aerospace Engineering from Rensselaer Polytechnic Institute, completed May
          2026, and secondary school at Waynflete before it.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        {education.map((e) => (
          <Reveal as="article" className="project" key={e.slug}>
            <div className="project__head">
              <span className="project__num">{e.num}</span>
              <h2 className="project__title">
                <Link to={`/experience/${e.slug}`}><Letters text={e.org} /></Link>
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
            {e.highlights?.length ? (
              <>
                <p className="meta edu__highlights-label">Highlighted classes</p>
                <ul className="specs">
                  {e.highlights.map((h) => (
                    <li key={h.k}>
                      <span className="k">{h.k}</span>
                      <span className="v">{h.v}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <Link className="link-arrow" to={`/experience/${e.slug}`}>
              <Letters text="Full write-up" /> <span className="arr">&rarr;</span>
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

    </>
  );
}
