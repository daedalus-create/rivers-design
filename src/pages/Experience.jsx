import Reveal from "../components/Reveal";
import Divider from "../components/Divider";

export default function Experience() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Where I&rsquo;ve worked
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Experience
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Hands-on engineering roles across manufacturing and design. Placeholder: swap in the real story for
          each role.
        </Reveal>
      </section>

      <Divider to="/experience/work-excerpts" label="Work Excerpts" />
      <Divider
        to="/experience/resume"
        label="Resume"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />
      <Divider to="/experience/education" label="Education" />
    </>
  );
}
