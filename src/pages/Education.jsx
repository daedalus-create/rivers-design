import Reveal from "../components/Reveal";

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
        <Reveal className="statement">
          <h2 className="statement__label">
            Rensselaer Polytechnic Institute<span className="colon">:</span>
          </h2>
          <p className="statement__text">
            Troy, NY — Bachelor of Science in Mechanical Dual Aerospace Engineering.
            <br />
            August 2022 – Projected Graduation: May 2026.
          </p>
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal as="h2" className="section-title">
          Highlighted Classes<span className="colon">:</span>
        </Reveal>
        <Reveal as="ul" className="specs" stagger={1}>
          <li>
            <span className="k">Manufacturing Processes</span>
            <span className="v">Manufacturing</span>
          </li>
          <li>
            <span className="k">Systems Laboratory 1</span>
            <span className="v">Lab</span>
          </li>
          <li>
            <span className="k">Space Vehicle Design Capstone</span>
            <span className="v">Capstone</span>
          </li>
          <li>
            <span className="k">Numerical Design Optimization</span>
            <span className="v">Design</span>
          </li>
          <li>
            <span className="k">Propulsion Systems</span>
            <span className="v">Aerospace</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
