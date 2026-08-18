// Site-map waypoints. Positions (x%, y%) must stay in sync with the
// POSITIONS dict in tools/generate-map.py, which uses these same
// coordinates to bend the trail paths in mapTrails.js.
//
// cluster "hub" = always visible (Home, Experience, Projects, About).
// Everything else only shows once its hub is clicked (see MapMenu).

// Hub waypoints (the four "sections") can each carry an `icon` path —
// MapMenu already renders it when present, just none are set right
// now (custom icons pending).
//
// Positions are snapped onto real terrain features by
// tools/generate-map.py (hubs onto the nearest peak summit, sub-pages
// onto the nearest valley floor) — re-run that script and copy its
// printed values here if the terrain seed ever changes.
export const mapWaypoints = [
  { node: "home", href: "/", x: 44.8, y: 26.0, cluster: "hub", label: "Home" },
  { node: "experience", href: "/experience", x: 21.3, y: 58.9, cluster: "hub", label: "Experience" },
  { node: "work", href: "/experience/work-excerpts", x: 22.9, y: 83.3, cluster: "experience", label: "Work Excerpts" },
  { node: "resume", href: "/experience/resume", x: 30.7, y: 83.3, cluster: "experience", label: "Resume" },
  { node: "projects", href: "/projects", x: 58.9, y: 44.7, cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", x: 34.3, y: 89.3, cluster: "projects", label: "Completed" },
  { node: "working", href: "/projects/still-working", x: 77.1, y: 58.3, cluster: "projects", label: "Still Working" },
  { node: "about", href: "/about", x: 75.7, y: 24.6, cluster: "hub", label: "About Me" },
  { node: "contact", href: "/about/contact", x: 80.0, y: 57.1, cluster: "about", label: "Contact" },
];

// Zoom-target center (fraction of container 0..1) + fill scale per
// cluster, recomputed from the snapped positions' bounding box above
// (capped so the zoom-in never feels too extreme — see MapMenu).
export const zoomTargets = {
  experience: { fx: 0.26, fy: 0.71, scale: 1.7 },
  projects: { fx: 0.557, fy: 0.67, scale: 1.35 },
  about: { fx: 0.779, fy: 0.409, scale: 1.8 },
};
