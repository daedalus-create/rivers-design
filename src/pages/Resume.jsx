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
          Placeholder — a one-paragraph summary of the resume: degree or training, core skills, and what kind of
          role you&rsquo;re after.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal as="ul" className="specs">
          <li>
            <span className="k">Education</span>
            <span className="v">Placeholder — school / program / year</span>
          </li>
          <li>
            <span className="k">Skills</span>
            <span className="v">Placeholder — CAD / DFM / fabrication</span>
          </li>
          <li>
            <span className="k">Download</span>
            <span className="v">PDF coming soon — add resume.pdf and link it here</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
