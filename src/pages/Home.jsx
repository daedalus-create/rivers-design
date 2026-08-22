import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import ModelViewer from "../components/LazyModelViewer";
import { completedProjects } from "../data/projects";
import { roles } from "../data/roles";

export default function Home() {
  return (
    <>
      {/* Opening two sections follow the format of merttureli.com's own
          opening pair — the site's sizing/spacing system is already
          modelled on it. Structure borrowed, copy is Deon's. */}
      <section className="page-hero intro" aria-label="Introduction">
        <Reveal as="p" className="meta meta--wide intro__eyebrow">
          Mechanical / Aerospace engineering, Troy, NY
        </Reveal>
        <Reveal as="h1" className="intro__name" stagger={1}>
          Deon
          <span className="intro__name--last">Rivers</span>
        </Reveal>
        <Reveal as="p" className="lede intro__lede" stagger={2}>
          I design hardware for how it will actually get made. A Mechanical Dual Aerospace Engineering graduate of RPI,
          class of 2026, with a bias toward DFM and additive manufacturing.
        </Reveal>
        <Reveal className="intro__foot meta" stagger={3}>
          <span className="idx">01</span>
          <span>Placeholder: a one-line note on what you are looking for next</span>
        </Reveal>
      </section>

      <section className="section--tight wrap" id="about" aria-label="About Deon Rivers">
        <div className="about-split">
          <Reveal as="div" className="about-split__head">
            <span className="meta">About</span>
            <span className="meta meta--accent">02</span>
          </Reveal>

          <Reveal>
            <div className="portrait">
              <span className="portrait__note meta">Portrait: photo pending</span>
            </div>
          </Reveal>

          <Reveal stagger={1}>
            <h2 className="display about-split__name">Deon Rivers</h2>
            <p className="lede">
              A Mechanical Dual Aerospace Engineering graduate of Rensselaer Polytechnic Institute, building
              toward a career in design, DFM, and additive manufacturing.
            </p>
            <p className="about-split__body">
              Hands-on experience spans CAD design, machining, and rapid-prototyping work at Dreki Systems,
              alongside side projects like an additively-manufactured jet engine and a Python orbital-maneuver
              solver. Room Manager at RPI&rsquo;s student makerspace, The Forge, since 2022, helping other
              students prototype and design for manufacturability.
            </p>
            <ul className="specs">
              <li>
                <span className="k">Based</span>
                <span className="v">Troy, NY</span>
              </li>
              <li>
                <span className="k">Focus</span>
                <span className="v">DFM / Additive manufacturing / Product design</span>
              </li>
              <li>
                <span className="k">Tools</span>
                <span className="v">Siemens NX / Fusion 360 / Autodesk Inventor / Mastercam / MATLAB</span>
              </li>
              <li>
                <span className="k">Degree</span>
                <span className="v">B.S. Mechanical Dual Aerospace Engineering, RPI, 2026</span>
              </li>
              <li>
                <span className="k">Next</span>
                <span className="v">Placeholder: the role or work you are after</span>
              </li>
            </ul>
          </Reveal>
        </div>
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
                <Link to={`/experience/${r.slug}`}>{r.org}</Link>
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
            <Link className="link-arrow" to={`/experience/${r.slug}`}>
              Full role details <span className="arr">&rarr;</span>
            </Link>
          </Reveal>
        ))}
      </section>
    </>
  );
}
