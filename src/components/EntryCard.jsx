import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import Letters from "./Letters";
import SpecList from "./SpecList";
import ModelViewer from "./LazyModelViewer";

// The card every listed thing uses: projects, work roles, schools, and
// classes. They were four near-identical blocks of markup copied across
// eight pages, which is how a project card and a role card drifted into
// looking subtly different. One component now, and every section gets
// the same card by construction.
//
// Everything past the title is optional, which is what lets one card
// serve all four: a class has no viewer, no specs, and no page of its
// own, while an education entry adds a second key/value list for its
// highlighted courses.
export default function EntryCard({
  entry,
  to,
  viewerTag,
  linkLabel,
  headingLevel = 2,
  highlightsLabel = "Highlighted classes",
}) {
  const Heading = `h${headingLevel}`;
  const title = to ? (
    <Link to={to}>
      <Letters text={entry.title} />
    </Link>
  ) : (
    entry.title
  );

  return (
    <Reveal as="article" className="entry">
      <div className="entry__head">
        <span className="entry__num">{entry.num}</span>
        <Heading className="entry__title">{title}</Heading>
      </div>

      {entry.sub && <p className="entry__sub">{entry.sub}</p>}
      {entry.desc && <p className="entry__desc">{entry.desc}</p>}

      {entry.model && <ModelViewer kind={entry.model} tag={viewerTag} />}

      <SpecList items={entry.specs} />
      <SpecList items={entry.highlights} label={highlightsLabel} />

      {to && linkLabel && (
        <Link className="link-arrow" to={to}>
          <Letters text={linkLabel} /> <span className="arr">&rarr;</span>
        </Link>
      )}
    </Reveal>
  );
}
