import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import { completedProjects } from "../data/projects";

export default function ProjectsCompleted() {
  return (
    <>
      <PageHero eyebrow="Rivers Design / Projects" title="Completed" lede="Built or designed through to a finished concept." />
      <EntryList
        entries={completedProjects}
        basePath="/projects"
        viewerTag="3D Placeholder / Model pending"
        linkLabel="Full write-up"
        ariaLabel="Completed"
      />
    </>
  );
}
