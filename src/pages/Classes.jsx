import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { classes } from "../data/classes";

export default function Classes() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience /{" "}
          <Link to="/experience/education" style={{ color: "inherit" }}>
            Education
          </Link>
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Classes
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Every class taken at RPI toward the Mechanical Dual Aerospace Engineering degree.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        {classes.map((c) => (
          <Reveal as="article" className="project" key={c.slug}>
            <div className="project__head">
              <span className="project__num">{c.num}</span>
              <h2 className="project__title">{c.title}</h2>
            </div>
            <p className="project__sub">{c.sub}</p>
            <p className="project__desc">{c.desc}</p>
          </Reveal>
        ))}
      </section>

      <section className="section--tight wrap">
        <Reveal stagger={2}>
          <Link className="link-arrow" to="/experience/education">
            &larr; Back to Education
          </Link>
        </Reveal>
      </section>
    </>
  );
}
