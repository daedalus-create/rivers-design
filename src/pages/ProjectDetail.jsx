import { Link, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import Letters from "../components/Letters";
import Breadcrumbs from "../components/Breadcrumbs";
import ModelViewer from "../components/LazyModelViewer";
import { getProject } from "../data/projects";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFound />;

  const STATUS_PAGES = {
    completed: { href: "/projects/completed", label: "Completed" },
    "in-progress": { href: "/projects/in-progress", label: "Work in Progress" },
    planned: { href: "/projects/planned", label: "Planned" },
  };
  const { href: backHref, label: backLabel } = STATUS_PAGES[project.status];

  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          <Breadcrumbs node={slug} />
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          {project.title}
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          {project.sub}
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal>
          <ModelViewer
            kind={project.model}
            height="clamp(320px, 48vw, 600px)"
          />
        </Reveal>
        <Reveal as="ul" className="specs" stagger={1}>
          {project.specs.map((s) => (
            <li key={s.k}>
              <span className="k">{s.k}</span>
              <span className="v">{s.v}</span>
            </li>
          ))}
        </Reveal>
        <Reveal stagger={2}>
          <Link className="link-arrow" to={backHref}>
            <span className="arr">&larr;</span> <Letters text={`Back to ${backLabel}`} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
