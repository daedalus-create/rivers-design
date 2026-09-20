import PageHero from "../components/PageHero";
import Breadcrumbs from "../components/Breadcrumbs";
import EntryList from "../components/EntryList";
import { roles } from "../data/roles";

export default function WorkExcerpts() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs node="work" />} title="Work Excerpts" />
      <EntryList
        entries={roles}
        basePath="/experience"
        linkLabel="Full role details"
        ariaLabel="Work excerpts"
      />
    </>
  );
}
