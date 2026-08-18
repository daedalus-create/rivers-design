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
          Placeholder bio — who you are, what you study or practice, and what you&rsquo;re building toward. Two
          or three sentences, written plainly.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal className="statement">
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
        <Reveal className="statement" stagger={1}>
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
            <span className="v">Placeholder — CAD, slicers, shop tools</span>
          </li>
          <li>
            <span className="k">Now</span>
            <span className="v">Placeholder — current role or study</span>
          </li>
        </Reveal>
      </section>

      <Divider to="/about/contact" label="Contact" />
    </>
  );
}
