import Reveal from "../components/Reveal";
import Breadcrumbs from "../components/Breadcrumbs";

export default function Contact() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          <Breadcrumbs node="contact" />
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
              <a href="mailto:KangNamu@icloud.com" style={{ color: "inherit" }}>
                KangNamu@icloud.com
              </a>
            </span>
          </li>
          <li>
            <span className="k">Phone</span>
            <span className="v">
              <a href="tel:+12073038314" style={{ color: "inherit" }}>
                (207) 303-8314
              </a>
            </span>
          </li>
          <li>
            <span className="k">Site</span>
            <span className="v">rivers-design.com</span>
          </li>
          <li>
            <span className="k">Elsewhere</span>
            <span className="v">Placeholder: LinkedIn / GitHub / Printables</span>
          </li>
        </Reveal>
      </section>
    </>
  );
}
