import Reveal from "../components/Reveal";

export default function Resume() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Resume
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Mechanical / Aerospace engineering student at RPI with hands-on manufacturing and CAD experience —
          looking for engineering roles in design, DFM, and additive manufacturing.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal as="ul" className="specs">
          <li>
            <span className="k">Education</span>
            <span className="v">B.S. Mechanical Dual Aerospace Engineering — RPI, expected May 2026</span>
          </li>
          <li>
            <span className="k">Skills</span>
            <span className="v">CAD Modeling / Project Management / Rapid Prototyping / Additive Manufacturing</span>
          </li>
          <li>
            <span className="k">Software</span>
            <span className="v">Siemens NX / Fusion 360 / Autodesk Inventor / Mastercam / MATLAB</span>
          </li>
          <li>
            <span className="k">Download</span>
            <span className="v">Available on request — see Contact for email</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
