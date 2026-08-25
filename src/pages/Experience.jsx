import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import Letters from "../components/Letters";
import EntryCard from "../components/EntryCard";
import { roleHighlights } from "../data/roles";
import { educationHighlights } from "../data/education";

// Same shape as the Projects hub: each section previews its first two
// entries rather than being a bare divider, so the page shows the work
// instead of only linking to it. The "first two" rule lives with the
// data — see roleHighlights / educationHighlights.
//
// Resume sits last and stays a link-through: it is a single page of
// summary, not a list, so it has no first-two to preview.
const SECTIONS = [
  {
    key: "work",
    label: "Work Excerpts",
    href: "/experience/work-excerpts",
    basePath: "/experience",
    entries: roleHighlights,
    allLabel: "All Work Excerpts",
    divider: {},
  },
  {
    key: "education",
    label: "Education",
    href: "/experience/education",
    basePath: "/experience",
    entries: educationHighlights,
    allLabel: "All Education",
    divider: {
      iconLeft: "/assets/divider-icon-3.svg",
      iconRight: "/assets/divider-icon-2.svg",
      flip: true,
    },
  },
];

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

      {SECTIONS.map(({ key, label, href, basePath, entries, allLabel, divider }) => (
        <div key={key}>
          <Divider to={href} label={label} {...divider} />

          <section className="section--tight wrap" aria-label={`${label} highlights`}>
            {entries.map((entry) => (
              <EntryCard
                key={entry.slug}
                entry={entry}
                to={`${basePath}/${entry.slug}`}
                viewerTag="3D Placeholder / Info & pics pending"
                headingLevel={3}
              />
            ))}

            <Reveal>
              <Link className="link-arrow" to={href}>
                <Letters text={allLabel} /> <span className="arr">&rarr;</span>
              </Link>
            </Reveal>
          </section>
        </div>
      ))}

      <Divider to="/experience/resume" label="Resume" />
    </>
  );
}
