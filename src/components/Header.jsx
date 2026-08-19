import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MapMenu from "./MapMenu";

function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { mm, dd, yyyy };
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { mm, dd, yyyy } = formatDate(new Date());

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <header className="site-header wrap">
      {/* Moving group — fixed to the viewport, stays put while the page scrolls beneath it */}
      <div className="site-header__fixed">
        <Link className="logo" to="/" aria-label="Rivers Design — home">
          <img src="/assets/logo.svg" alt="Rivers Design" />
        </Link>

        <button
          className={`menu-btn${open ? " open" : ""}`}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Static group — lives in the header's normal flow, scrolls away with the page */}
      <div className="site-header__static">
        <p className="site-header__tagline">
          <img className="site-header__tagline-icon site-header__tagline-icon--bulb" src="/assets/logo-lightbulb.svg" alt="" aria-hidden="true" />
          <span className="site-header__tagline-text">Dream to Build</span>
          <img className="site-header__tagline-icon site-header__tagline-icon--alert" src="/assets/logo-alert.svg" alt="" aria-hidden="true" />
        </p>

        <div className="pill pill--date">
          <span className="pill__inner">
            {mm}
            <span className="slash">/</span>
            {dd}
            <span className="slash">/</span>
            {yyyy}
          </span>
        </div>
      </div>

      <MapMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
