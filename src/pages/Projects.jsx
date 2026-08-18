import Reveal from "../components/Reveal";
import Divider from "../components/Divider";

export default function Projects() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Selected work
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Projects
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Hardware designed for how it will actually be made. Every project here starts from DFM and ends with
          something you can hold, run, or fly.
        </Reveal>
      </section>

      <Divider to="/projects/completed" label="Completed" />
      <Divider
        to="/projects/still-working"
        label="Still Working"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />
    </>
  );
}
