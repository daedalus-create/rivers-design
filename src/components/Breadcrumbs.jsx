import { Link } from "react-router-dom";
import { getNavNode, ancestorsOf } from "../data/siteTree";

// The eyebrow line every "deeper" page opens with, rebuilt as a real
// breadcrumb trail instead of a string that happened to look like one.
//
// Before this, every detail page hand-typed its own "Rivers Design /
// Experience / <Link>Work Excerpts</Link>" - and only ever linked the
// one crumb right above it, because that was the only one the page
// already had a Link element sitting around for (its own "back to X"
// button). Home and any middle segment were plain text you could read
// but not click, which is a strange thing for a breadcrumb to do at
// three levels deep: it point at where you are without offering a way
// back to anywhere but the one rung directly above you.
//
// siteTree.js already has to know this hierarchy for the menu, so this
// reads it from there (ancestorsOf) rather than keeping a second, looser
// copy of the same tree as hand-typed strings scattered across a dozen
// pages - the two could never have drifted apart if there had only ever
// been the one.
//
// `node` is the current page's own id in NAV. The trail rendered is
// everything ABOVE it - Home, then each ancestor outermost first - never
// the page itself, since the <h1> right below already says where you
// are; a breadcrumb's job is only to say how to leave.
export default function Breadcrumbs({ node }) {
  const trail = [
    { href: "/", label: "Rivers Design" },
    ...ancestorsOf(node).map((id) => getNavNode(id)),
  ].filter(Boolean);

  return (
    <span className="crumbs">
      {trail.map((crumb, i) => (
        <span key={crumb.href}>
          {i > 0 && " / "}
          <Link to={crumb.href}>{crumb.label}</Link>
        </span>
      ))}
    </span>
  );
}
