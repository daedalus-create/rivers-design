import Reveal from "../components/Reveal";

export default function Contact() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / About
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Contact
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal as="ul" className="specs">
          <li>
            <span className="k">Email</span>
            <span className="v">
              <a href="mailto:hello@rivers-design.com" style={{ color: "inherit" }}>
                hello@rivers-design.com
              </a>
            </span>
          </li>
          <li>
            <span className="k">Site</span>
            <span className="v">rivers-design.com</span>
          </li>
          <li>
            <span className="k">Elsewhere</span>
            <span className="v">Placeholder — LinkedIn / GitHub / Printables</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
