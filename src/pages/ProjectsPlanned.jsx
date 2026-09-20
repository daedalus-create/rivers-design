import PageHero from "../components/PageHero";
import Breadcrumbs from "../components/Breadcrumbs";
import EntryList from "../components/EntryList";
import { plannedProjects } from "../data/projects";

export default function ProjectsPlanned() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs node="planned" />} title="Planned" lede="Researched and specified, waiting on time or on the work they depend on." />
      <EntryList
        entries={plannedProjects}
        basePath="/projects"
        linkLabel="Full write-up"
        ariaLabel="Planned"
      />
    </>
  );
}
