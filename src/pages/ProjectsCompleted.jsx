import PageHero from "../components/PageHero";
import Breadcrumbs from "../components/Breadcrumbs";
import EntryList from "../components/EntryList";
import { completedProjects } from "../data/projects";

export default function ProjectsCompleted() {
  return (
    <>
      <PageHero eyebrow={<Breadcrumbs node="completed" />} title="Completed" lede="Built or designed through to a finished concept." />
      <EntryList
        entries={completedProjects}
        basePath="/projects"
        linkLabel="Full write-up"
        ariaLabel="Completed"
      />
    </>
  );
}
