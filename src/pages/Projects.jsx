import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import { highlightsFor } from "../data/projects";
import Letters from "../components/Letters";
import EntryCard from "../components/EntryCard";

// The hub previews the first two entries of each section rather than
// being three bare dividers, so the page shows actual work instead of
// only linking to it. `highlightsFor` owns the "first two" rule — see
// src/data/projects.js.
const SECTIONS = [
  {
    status: "completed",
    label: "Completed",
    href: "/projects/completed",
    tag: "3D Placeholder / Model pending",
    divider: {},
  },
  {
    status: "in-progress",
    label: "Work in Progress",
    href: "/projects/in-progress",
    tag: "3D Placeholder / In progress",
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
    tag: "3D Placeholder / Concept",
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

      {SECTIONS.map(({ status, label, href, tag, divider }) => (
        <div key={status}>
          <Divider to={href} label={label} {...divider} />

          <section className="section--tight wrap" aria-label={`${label} highlights`}>
            {highlightsFor(status).map((p) => (
              <EntryCard
                key={p.slug}
                entry={p}
                to={`/projects/${p.slug}`}
                viewerTag={tag}
                headingLevel={3}
              />
            ))}

            <Reveal>
              <Link className="link-arrow" to={href}>
                <Letters text={`All ${label}`} /> <span className="arr">&rarr;</span>
              </Link>
            </Reveal>
          </section>
        </div>
      ))}
    </>
  );
}
