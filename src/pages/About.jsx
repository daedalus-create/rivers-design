import Reveal from "../components/Reveal";
import Divider from "../components/Divider";

export default function About() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / The person behind it
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          About
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Deon Rivers — a Mechanical Dual Aerospace Engineering student at Rensselaer Polytechnic Institute,
          building toward a career in design, DFM, and additive manufacturing.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal className="statement">
          <h2 className="statement__label">
            Who I Am<span className="colon">:</span>
          </h2>
          <p className="statement__text">
            Mechanical / Aerospace engineering student at RPI, expected to graduate May 2026. Hands-on experience
            spans CAD design, machining, and rapid-prototyping work at Dreki Systems, alongside side projects like
            an additively-manufactured jet engine and a Python orbital-maneuver solver. Room Manager at RPI&rsquo;s
            student makerspace, The Forge, since 2022 — helping other students prototype and design for
            manufacturability.
          </p>
        </Reveal>
        <Reveal className="statement" stagger={1}>
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
        <Reveal className="statement" stagger={2}>
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

      <section className="section--tight wrap">
        <Reveal as="ul" className="specs">
          <li>
            <span className="k">Focus</span>
            <span className="v">DFM / Additive manufacturing / Product design</span>
          </li>
          <li>
            <span className="k">Tools</span>
            <span className="v">Siemens NX / Fusion 360 / Autodesk Inventor / Mastercam / MATLAB</span>
          </li>
          <li>
            <span className="k">Now</span>
            <span className="v">Mechanical / Aerospace Engineering, RPI — Class of 2026</span>
          </li>
        </Reveal>
      </section>

      <Divider to="/about/contact" label="Contact" />
    </>
  );
}
