import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import Letters from "../components/Letters";
import EntryCard from "../components/EntryCard";
import Timeline from "../components/Timeline";
import { roles } from "../data/roles";
import { educationHighlights } from "../data/education";

// The work history is a timeline rather than a preview of the first two
// roles: eight jobs in reverse-chronological order is a shape, and a
// shape is worth drawing. Each one opens as it reaches the reading band,
// so scrolling the page is what reads it.
//
// Education keeps the two-entry preview it had, because two schools are
// not a chronology worth drawing a trunk down. Resume stays last and
// stays a link-through, being a summary page rather than a list.
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
          Eight years of work, from a school stage crew to a manufacturing floor. Newest first: each entry
          opens as you reach it.
        </Reveal>
      </section>

      <section className="section--tight wrap" aria-label="Work history">
        <Timeline entries={roles} basePath="/experience" />

        <Reveal>
          <Link className="link-arrow" to="/experience/work-excerpts">
            <Letters text="All Work Excerpts" /> <span className="arr">&rarr;</span>
          </Link>
        </Reveal>
      </section>

      <Divider
        to="/experience/education"
        label="Education"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />

      <section className="section--tight wrap" aria-label="Education highlights">
        {educationHighlights.map((entry) => (
          <EntryCard
            key={entry.slug}
            entry={entry}
            to={`/experience/${entry.slug}`}
            viewerTag="3D Placeholder / Info & pics pending"
            headingLevel={3}
          />
        ))}

        <Reveal>
          <Link className="link-arrow" to="/experience/education">
            <Letters text="All Education" /> <span className="arr">&rarr;</span>
          </Link>
        </Reveal>
      </section>

      <Divider to="/experience/resume" label="Resume" />
    </>
  );
}
