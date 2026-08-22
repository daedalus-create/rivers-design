import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import { plannedProjects } from "../data/projects";

export default function ProjectsPlanned() {
  return (
    <>
      <PageHero eyebrow="Rivers Design / Projects" title="Planned" lede="Researched and specified, waiting on time or on the work they depend on." />
      <EntryList
        entries={plannedProjects}
        basePath="/projects"
        viewerTag="3D Placeholder / Concept"
        linkLabel="Full write-up"
        ariaLabel="Planned"
      />
    </>
  );
}
