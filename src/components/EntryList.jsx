import EntryCard from "./EntryCard";

// A section of entry cards. Pairs with PageHero to make a listing page
// two components long, which is why ProjectsCompleted, ProjectsPlanned,
// and ProjectsInProgress no longer exist as three near-identical files
// differing by a heading and a viewer caption.
export default function EntryList({
  entries,
  basePath,
  viewerTag,
  linkLabel,
  headingLevel = 2,
  linkable = true,
  className = "section--tight wrap",
  ariaLabel,
}) {
  return (
    <section className={className} aria-label={ariaLabel}>
      {entries.map((entry) => (
        <EntryCard
          key={entry.slug}
          entry={entry}
          to={linkable ? `${basePath}/${entry.slug}` : undefined}
          viewerTag={viewerTag}
          linkLabel={linkLabel}
          headingLevel={headingLevel}
        />
      ))}
    </section>
  );
}
