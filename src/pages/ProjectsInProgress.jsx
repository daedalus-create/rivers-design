import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import { inProgressProjects } from "../data/projects";

export default function ProjectsInProgress() {
  return (
    <>
      <PageHero eyebrow="Rivers Design / Projects" title="Work in Progress" lede="On the bench now, at various stages between drawing and prototype." />
      <EntryList
        entries={inProgressProjects}
        basePath="/projects"
        viewerTag="3D Placeholder / In progress"
        linkLabel="Full write-up"
        ariaLabel="Work in Progress"
      />
    </>
  );
}
