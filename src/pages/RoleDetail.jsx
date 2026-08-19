import { Link, useParams } from "react-router-dom";
import Reveal from "../components/Reveal";
import ModelViewer from "../components/LazyModelViewer";
import { getRole } from "../data/roles";
import NotFound from "./NotFound";

export default function RoleDetail() {
  const { slug } = useParams();
  const role = getRole(slug);

  if (!role) return <NotFound />;

  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience /{" "}
          <Link to="/experience/work-excerpts" style={{ color: "inherit" }}>
            Work Excerpts
          </Link>
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          {role.title}
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          {role.sub}
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal>
          <ModelViewer kind={role.model} tag="3D Placeholder / Info & pics pending" height="clamp(320px, 48vw, 600px)" />
        </Reveal>
        <Reveal as="ul" className="specs" stagger={1}>
          {role.specs.map((s) => (
            <li key={s.k}>
              <span className="k">{s.k}</span>
              <span className="v">{s.v}</span>
            </li>
          ))}
        </Reveal>
        <Reveal className="xp__body" stagger={2}>
          {role.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
        <Reveal stagger={3}>
          <Link className="link-arrow" to="/experience/work-excerpts">
            &larr; Back to Work Excerpts
          </Link>
        </Reveal>
      </section>
    </>
  );
}
