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
      <div className="site-header__bar">
        <Link className="logo" to="/" aria-label="Rivers Design — home">
          <img src="/assets/logo-lightbulb.svg" alt="Rivers Design" />
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

      <p className="site-header__tagline">
        Engineer for function, design for form.
        <img className="site-header__tagline-icon" src="/assets/logo-alert.svg" alt="" aria-hidden="true" />
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

      <MapMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
