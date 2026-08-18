import { Link } from "react-router-dom";

// Page-break divider: rule + icon marks + wordmark + a pill linking
// onward to the next page/section — the Figma "spacer" component.
// Keeps the original two-line wordmark treatment (never the full
// logo lockup used elsewhere for the standalone brand mark).
export default function Divider({
  to,
  label,
  iconLeft = "/assets/divider-icon-2.svg",
  iconRight = "/assets/divider-icon-1.svg",
  flip = false,
}) {
  return (
    <div className={`divider wrap${flip ? " divider--flip" : ""}`}>
      <div className="divider__row">
        <div className="divider__brand">
          <img src={iconLeft} alt="" />
          <span className="divider__wordmark">
            Rivers
            <br />
            Design
          </span>
          <img src={iconRight} alt="" />
        </div>
        <Link className="pill" to={to} style={{ textDecoration: "none" }}>
          <span className="pill__inner">{label}</span>
        </Link>
      </div>
    </div>
  );
}
