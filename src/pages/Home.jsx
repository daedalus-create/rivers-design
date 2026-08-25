import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import { completedProjects } from "../data/projects";
import { homeTimeline } from "../data/timeline";
import Timeline from "../components/Timeline";

export default function Home() {
  return (
    <>
      {/* Opening two sections follow the format of merttureli.com's own
          opening pair — the site's sizing/spacing system is already
          modelled on it. Structure borrowed, copy is Deon's. */}
      <section className="page-hero intro wrap" aria-label="Introduction">
        <Reveal as="h1" className="intro__name">
          Deon
          <span className="intro__name--last">Rivers</span>
        </Reveal>
        <Reveal as="p" className="lede intro__lede" stagger={1}>
          I design hardware for how it will actually get made. A Mechanical and Aerospace Engineering graduate of RPI,
          class of 2026, with a bias toward DFM and additive manufacturing.
        </Reveal>
        <Reveal className="intro__foot meta" stagger={2}>
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
              <img
                src="/assets/deon-rivers-portrait.jpg"
                alt="Deon Rivers"
                width="800"
                height="800"
                loading="lazy"
                decoding="async"
              />
            </div>
          </Reveal>

          <Reveal stagger={1}>
            <p className="lede">
              A Mechanical and Aerospace Engineering graduate of Rensselaer Polytechnic Institute, building
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
                <span className="v">B.S. Mechanical and Aerospace Engineering, RPI, 2026</span>
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

      {/* Same arrangement as the experience section below, in the
          Projects page's own chrome: the two need to read as two kinds of
          thing, not one list that changed subject halfway down. */}
      <section className="section wrap" id="projects" aria-label="Projects">
        <Timeline
          entries={completedProjects}
          basePath="/projects"
          linkLabel="Full write-up"
          viewerTag="3D Placeholder / Model pending"
          stacked
          variant="board"
        />
      </section>

      <Divider to="/experience" label="Experience" iconLeft="/assets/divider-icon-3.svg" iconRight="/assets/divider-icon-2.svg" flip />

      {/* The Experience page's timeline, three entries of it, with the
          trunk held to the left rather than alternating: at three entries
          a centred trunk has nothing to alternate around. */}
      <section className="section wrap" id="experience" aria-label="Experience">
        <Timeline
          entries={homeTimeline}
          basePath="/experience"
          linkLabel="Full details"
          viewerTag="3D Placeholder / Info &amp; pics pending"
          stacked
        />
      </section>
    </>
  );
}
