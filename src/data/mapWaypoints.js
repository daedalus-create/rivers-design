// Site-map waypoints. Positions (x%, y%) must stay in sync with the
// POSITIONS dict in tools/generate-map.py, which uses these same
// coordinates to bend the trail paths in mapTrails.js.
//
// cluster "hub" = always visible (Home, Experience, Projects, About).
// Everything else only shows once its hub is clicked (see MapMenu) —
// two zoom levels deep: hub -> its sub-pages -> (for Completed/Work
// in Progress/Planned/Work Excerpts) individual project/role pages.

// Hub waypoints (the four "sections") can each carry an `icon` path —
// MapMenu already renders it when present, just none are set right
// now (custom icons pending).
//
// Positions are snapped onto real terrain features by
// tools/generate-map.py (hubs onto the nearest peak summit, sub-pages
// onto the nearest valley floor, each excluding cells already claimed
// by an earlier point so two nav points never collapse onto the same
// spot) — re-run that script and copy its printed values here if the
// terrain seed or POSITIONS_INTENT ever changes.
export const mapWaypoints = [
  { node: "home", href: "/", x: 44.8, y: 26.0, cluster: "hub", label: "Home" },
  { node: "experience", href: "/experience", x: 21.3, y: 58.9, cluster: "hub", label: "Experience" },
  { node: "work", href: "/experience/work-excerpts", x: 22.9, y: 83.3, cluster: "experience", label: "Work Excerpts" },
  { node: "sunthru", href: "/experience/sunthru", x: 8.6, y: 86.9, cluster: "work", label: "SunThru" },
  { node: "dreki", href: "/experience/dreki", x: 30.7, y: 63.1, cluster: "work", label: "Dreki Systems" },
  { node: "resume", href: "/experience/resume", x: 30.7, y: 83.3, cluster: "experience", label: "Resume" },
  { node: "projects", href: "/projects", x: 58.9, y: 44.7, cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", x: 30.0, y: 88.1, cluster: "projects", label: "Completed" },
  { node: "pyro-mk7", href: "/projects/pyro-mk7", x: 21.4, y: 72.6, cluster: "completed", label: "Pyro MK:7" },
  { node: "hephaestus-forge", href: "/projects/hephaestus-forge", x: 54.3, y: 72.6, cluster: "completed", label: "Hephaestus Forge" },
  { node: "in-progress", href: "/projects/in-progress", x: 50.0, y: 95.2, cluster: "projects", label: "Work in Progress" },
  { node: "wip-1", href: "/projects/wip-1", x: 57.9, y: 86.9, cluster: "in-progress", label: "Build 1" },
  { node: "planned", href: "/projects/planned", x: 80.0, y: 57.1, cluster: "projects", label: "Planned" },
  { node: "plan-1", href: "/projects/plan-1", x: 69.3, y: 76.2, cluster: "planned", label: "Plan 1" },
  { node: "plan-2", href: "/projects/plan-2", x: 98.5, y: 51.2, cluster: "planned", label: "Plan 2" },
  { node: "about", href: "/about", x: 75.7, y: 24.6, cluster: "hub", label: "About Me" },
  { node: "contact", href: "/about/contact", x: 82.9, y: 57.1, cluster: "about", label: "Contact" },
];

// Zoom-target center (fraction of container 0..1) + fill scale per
// zoomable node, computed by zoom_target_for() in
// tools/generate-map.py (which prints these) so that at the given
// scale BOTH the scaled scene fully covers the viewport (no exposed
// edge) AND every member waypoint lands inside the visible viewport
// (not just off in the padded, possibly-off-canvas framing margin).
export const zoomTargets = {
  experience: { fx: 0.271, fy: 0.76, scale: 3.2 },
  projects: { fx: 0.55, fy: 0.636, scale: 1.47 },
  about: { fx: 0.758, fy: 0.571, scale: 3.2 },
  completed: { fx: 0.378, fy: 0.609, scale: 1.96 },
  "in-progress": { fx: 0.579, fy: 0.778, scale: 3.2 },
  planned: { fx: 0.778, fy: 0.637, scale: 2.33 },
  work: { fx: 0.252, fy: 0.726, scale: 2.39 },
};
