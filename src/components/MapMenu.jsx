import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mapWaypoints, zoomTargets } from "../data/mapWaypoints";
import { mapTrails } from "../data/mapTrails";

// Interactive site map: only the four hub waypoints (Home, Experience,
// Projects, About Me) show at first. Clicking a hub zooms .map__scene
// into that territory and reveals its child waypoints — click the
// same hub a second time (or its own dot) to actually navigate there.
export default function MapMenu({ open, onClose }) {
  const location = useLocation();
  const mapRef = useRef(null);
  const sceneRef = useRef(null);
  const [zoom, setZoom] = useState(null);

  const applyZoom = (cluster) => {
    if (!cluster) {
      if (sceneRef.current) sceneRef.current.style.transform = "";
      setZoom(null);
      return;
    }
    const target = zoomTargets[cluster];
    const mapEl = mapRef.current;
    if (!target || !mapEl) return;
    const { fx, fy, scale } = target;
    const w = mapEl.clientWidth;
    const h = mapEl.clientHeight;
    const tx = w / 2 - scale * w * fx;
    const ty = h / 2 - scale * h * fy;
    if (sceneRef.current) {
      sceneRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }
    setZoom(cluster);
  };

  // reset zoom whenever the overlay closes or the route changes
  useEffect(() => {
    if (!open) applyZoom(null);
  }, [open]);
  useEffect(() => {
    applyZoom(null);
  }, [location.pathname]);

  // Escape zooms back out first; a second Escape closes the whole menu
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (zoom) {
        e.stopPropagation();
        applyZoom(null);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, zoom, onClose]);

  const handleHubClick = (e, wp) => {
    if (wp.node === "home") {
      if (zoom) {
        e.preventDefault();
        applyZoom(null);
      }
      return;
    }
    if (zoom === wp.node) return; // 2nd click: let the Link navigate
    e.preventDefault();
    applyZoom(wp.node);
  };

  const handleMapBackgroundClick = (e) => {
    if (e.target === mapRef.current || e.target === sceneRef.current) applyZoom(null);
  };

  const handleLinkClick = () => onClose();

  const otherHubs = mapWaypoints.filter(
    (wp) => wp.cluster === "hub" && wp.node !== "home" && wp.node !== zoom
  );

  return (
    <div className={`menu-overlay${open ? " open" : ""}`} id="site-menu">
      <nav className="menu-map-wrap" aria-label="Site map">
        <div className="map" ref={mapRef} data-zoom={zoom || undefined} onClick={handleMapBackgroundClick}>
          <button className="map__back" type="button" onClick={() => applyZoom(null)}>
            &larr; Map
          </button>

          {zoom && (
            <div className="map__jump" aria-label="Jump to another section">
              <span className="map__jump-label">Jump to</span>
              {otherHubs.map((hub) => (
                <button
                  key={hub.node}
                  type="button"
                  className="map__jump-btn"
                  onClick={() => applyZoom(hub.node)}
                >
                  {hub.icon && <img src={hub.icon} alt="" aria-hidden="true" />}
                  {hub.label}
                </button>
              ))}
            </div>
          )}

          <div className="map__scene" ref={sceneRef}>
            <div className="map__backdrop" aria-hidden="true" />
            <svg
              className="map__trails"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
              aria-hidden="true"
              fill="none"
            >
              {mapTrails.map((t, i) => (
                <path
                  key={i}
                  d={t.d}
                  data-cluster={t.cluster}
                  stroke={t.stroke}
                  strokeWidth={t.strokeWidth}
                  strokeDasharray={t.dash}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {mapWaypoints.map((wp) => {
              const isCurrent = location.pathname === wp.href;
              return (
                <Link
                  key={wp.node}
                  className="wp"
                  style={{ "--x": `${wp.x}%`, "--y": `${wp.y}%` }}
                  to={wp.href}
                  data-node={wp.node}
                  data-cluster={wp.cluster}
                  aria-current={isCurrent ? "page" : undefined}
                  onClick={(e) => {
                    if (wp.cluster === "hub") handleHubClick(e, wp);
                    if (!e.defaultPrevented) handleLinkClick();
                  }}
                >
                  {wp.icon && <img className="wp__icon" src={wp.icon} alt="" aria-hidden="true" />}
                  <span className="wp__dot" aria-hidden="true" />
                  <span className="wp__label">{wp.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
