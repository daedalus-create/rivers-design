import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import Letters from "../components/Letters";
import Timeline from "../components/Timeline";
import ProjectBoard from "../components/ProjectBoard";
import { projects, highlightsFor } from "../data/projects";

// The hub is the board first, then a preview of each section.
//
// Those two things answer different questions and the page needs both. The
// board answers "what is there" — all fourteen at once, filterable, nothing
// hidden behind a second page. The sections answer "what state is the work
// in", which is a division the board can filter to but cannot show you all
// three of at the same time.
//
// The page did have these sections once, built from EntryCard, and they were
// dropped when the board arrived because the board made them look redundant.
// They are not: losing them lost the only place on the site where the three
// states sat side by side.
//
// The previews use the same Timeline the home page uses, with the same
// props, so a section here and the projects section on the home page are
// the same component in the same configuration rather than two things that
// merely resemble each other. `highlightsFor` owns the "first two" rule —
// see src/data/projects.js, where HIGHLIGHT_COUNT lives.
const SECTIONS = [
  {
    status: "completed",
    label: "Completed",
    href: "/projects/completed",
    divider: {},
  },
  {
    status: "in-progress",
    label: "Work in Progress",
    href: "/projects/in-progress",
    divider: {
      iconLeft: "/assets/divider-icon-3.svg",
      iconRight: "/assets/divider-icon-2.svg",
      flip: true,
    },
  },
  {
    status: "planned",
    label: "Planned",
    href: "/projects/planned",
    divider: {},
  },
];

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

      {SECTIONS.map(({ status, label, href, divider }) => {
        const entries = highlightsFor(status);
        if (!entries.length) return null;
        return (
          <div key={status}>
            <Divider to={href} label={label} {...divider} />

            <section className="section--tight wrap" aria-label={`${label} highlights`}>
              <Timeline
                entries={entries}
                basePath="/projects"
                linkLabel="Full write-up"
                stacked
                variant="board"
              />

              <Reveal className="section__more">
                <Link className="link-arrow" to={href}>
                  <Letters text={`All ${label}`} /> <span className="arr">&rarr;</span>
                </Link>
              </Reveal>
            </section>
          </div>
        );
      })}
    </>
  );
}
