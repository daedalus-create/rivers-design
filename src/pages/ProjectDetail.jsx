import { Link, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { getProject } from "../data/projects";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFound />;

  const backHref = project.status === "completed" ? "/projects/completed" : "/projects/still-working";
  const backLabel = project.status === "completed" ? "Completed" : "Still Working";

  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Projects /{" "}
          <Link to={backHref} style={{ color: "inherit" }}>
            {backLabel}
          </Link>
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
            tag={project.status === "completed" ? "3D Placeholder / Model pending" : "3D Placeholder / Concept"}
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
            &larr; Back to {backLabel}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
