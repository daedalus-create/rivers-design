import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import { completedProjects } from "../data/projects";
import { roles } from "../data/roles";
import EntryCard from "../components/EntryCard";

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
          <span>Looking for roles in additive manufacturing and process development</span>
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
                <span className="v">Additive manufacturing / process development roles</span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <Divider to="/projects" label="Projects" />

      <section className="section wrap" id="projects" aria-label="Projects">
        {completedProjects.map((p) => (
          <EntryCard key={p.slug} entry={p} to={`/projects/${p.slug}`} headingLevel={3} />
        ))}
      </section>

      <Divider to="/experience" label="Experience" iconLeft="/assets/divider-icon-3.svg" iconRight="/assets/divider-icon-2.svg" flip />

      <section className="section wrap" id="experience" aria-label="Experience">
        {roles.map((r) => (
          <EntryCard
            key={r.slug}
            entry={r}
            to={`/experience/${r.slug}`}
            viewerTag="3D Placeholder / Info & pics pending"
            linkLabel="Full role details"
            headingLevel={3}
          />
        ))}
      </section>
    </>
  );
}
