import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import ProjectBoard from "../components/ProjectBoard";
import { projects } from "../data/projects";

// One board rather than three previewed sections. The old page showed the
// first two of each status and linked onward for the rest, which meant
// eight of the fourteen projects were only reachable through a second
// page. Filtering does that job without hiding anything.
//
// The per-status pages still exist and are still linked from the menu, so
// nothing that used to be addressable stopped being addressable.
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

      <section className="section--tight wrap" aria-label="All projects">
        <ProjectBoard projects={projects} />
      </section>

      <Divider
        to="/projects/completed"
        label="Completed"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />
    </>
  );
}
