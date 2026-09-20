import PageHero from "../components/PageHero";
import Breadcrumbs from "../components/Breadcrumbs";
import EntryList from "../components/EntryList";
import { inProgressProjects } from "../data/projects";

export default function ProjectsInProgress() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs node="in-progress" />} title="Work in Progress" lede="On the bench now, at various stages between drawing and prototype." />
      <EntryList
        entries={inProgressProjects}
        basePath="/projects"
        linkLabel="Full write-up"
        ariaLabel="Work in Progress"
      />
    </>
  );
}
