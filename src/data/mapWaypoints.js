// Site-map waypoints. Positions (x%, y%) must stay in sync with the
// POSITIONS dict in tools/generate-map.py, which uses these same
// coordinates to bend the trail paths in mapTrails.js.
//
// cluster "hub" = always visible (Home, Experience, Projects, About).
// Everything else only shows once its hub is clicked (see MapMenu).

// Hub waypoints (the four "sections") can each carry an `icon` path —
// MapMenu already renders it when present, just none are set right
// now (custom icons pending).
export const mapWaypoints = [
  { node: "home", href: "/", x: 50, y: 16, cluster: "hub", label: "Home" },
  { node: "experience", href: "/experience", x: 22, y: 42, cluster: "hub", label: "Experience" },
  { node: "work", href: "/experience/work-excerpts", x: 14, y: 68, cluster: "experience", label: "Work Excerpts" },
  { node: "resume", href: "/experience/resume", x: 32, y: 76, cluster: "experience", label: "Resume" },
  { node: "projects", href: "/projects", x: 56, y: 46, cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", x: 44, y: 74, cluster: "projects", label: "Completed" },
  { node: "working", href: "/projects/still-working", x: 68, y: 74, cluster: "projects", label: "Still Working" },
  { node: "about", href: "/about", x: 82, y: 40, cluster: "hub", label: "About Me" },
  { node: "contact", href: "/about/contact", x: 87, y: 68, cluster: "about", label: "Contact" },
];

// Zoom-target center (fraction of container 0..1) + fill scale per
// cluster, derived from where that cluster's own waypoints sit above.
export const zoomTargets = {
  experience: { fx: 0.22, fy: 0.62, scale: 1.5 },
  projects: { fx: 0.56, fy: 0.68, scale: 1.55 },
  about: { fx: 0.845, fy: 0.5, scale: 1.7 },
};
