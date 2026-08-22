import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Letters from "../components/Letters";

export default function NotFound() {
  return (
    <section className="page-hero wrap">
      <Reveal as="p" className="meta meta--wide">
        Rivers Design / 404
      </Reveal>
      <Reveal as="h1" className="display" stagger={1}>
        Not found
      </Reveal>
      <Reveal as="p" className="lede" stagger={2}>
        That page doesn&rsquo;t exist.{" "}
        <Link className="link-arrow" to="/" style={{ marginTop: 0, display: "inline" }}>
          <Letters text="Back to home" /> <span className="arr">&rarr;</span>
        </Link>
      </Reveal>
    </section>
  );
}
