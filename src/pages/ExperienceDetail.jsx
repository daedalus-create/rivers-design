import { Link, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { getRole } from "../data/roles";
import { getEducationEntry } from "../data/education";
import NotFound from "./NotFound";

// Flat detail page for every /experience/:slug leaf — roles (Work
// Excerpts) and education entries share this template and layout,
// differing only in which list they came from and where "back" goes.
export default function ExperienceDetail() {
  const { slug } = useParams();
  const role = getRole(slug);
  const edu = !role ? getEducationEntry(slug) : null;
  const item = role || edu;

  if (!item) return <NotFound />;

  const backHref = role ? "/experience/work-excerpts" : "/experience/education";
  const backLabel = role ? "Work Excerpts" : "Education";

  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience /{" "}
          <Link to={backHref} style={{ color: "inherit" }}>
            {backLabel}
          </Link>
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          {item.title}
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          {item.sub}
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal>
          <ModelViewer kind={item.model} tag="3D Placeholder / Info & pics pending" height="clamp(320px, 48vw, 600px)" />
        </Reveal>
        <Reveal as="ul" className="specs" stagger={1}>
          {item.specs.map((s) => (
            <li key={s.k}>
              <span className="k">{s.k}</span>
              <span className="v">{s.v}</span>
            </li>
          ))}
        </Reveal>
        <Reveal className="xp__body" stagger={2}>
          {item.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
        <Reveal stagger={3}>
          <Link className="link-arrow" to={backHref}>
            &larr; Back to {backLabel}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
