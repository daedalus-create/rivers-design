import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import { roles } from "../data/roles";

export default function WorkExcerpts() {
  return (
    <>
      <PageHero eyebrow="Rivers Design / Experience" title="Work Excerpts" />
      <EntryList
        entries={roles}
        basePath="/experience"
        viewerTag="3D Placeholder / Info & pics pending"
        linkLabel="Full role details"
        ariaLabel="Work excerpts"
      />
    </>
  );
}
