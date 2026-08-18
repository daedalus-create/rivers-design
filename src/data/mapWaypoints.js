// Site-map waypoints. Positions (x%, y%) must stay in sync with the
// POSITIONS dict in tools/generate-map.py, which uses these same
// coordinates to bend the trail paths in mapTrails.js.
//
// cluster "hub" = always visible (Home, Experience, Projects, About).
// Everything else only shows once its hub is clicked (see MapMenu).

// Hub waypoints (the four "sections") each carry an icon — reusing
// the same brand marks already used on the page-break dividers, so
// the map stays visually consistent with the rest of the site.
export const mapWaypoints = [
  { node: "home", href: "/", x: 50, y: 16, cluster: "hub", label: "Home", icon: "/assets/logo.svg" },
  { node: "experience", href: "/experience", x: 22, y: 42, cluster: "hub", label: "Experience", icon: "/assets/divider-icon-2.svg" },
  { node: "work", href: "/experience/work-excerpts", x: 14, y: 68, cluster: "experience", label: "Work Excerpts" },
  { node: "resume", href: "/experience/resume", x: 32, y: 76, cluster: "experience", label: "Resume" },
  { node: "projects", href: "/projects", x: 56, y: 46, cluster: "hub", label: "Projects", icon: "/assets/divider-icon-1.svg" },
  { node: "completed", href: "/projects/completed", x: 44, y: 74, cluster: "projects", label: "Completed" },
  { node: "working", href: "/projects/still-working", x: 68, y: 74, cluster: "projects", label: "Still Working" },
  { node: "about", href: "/about", x: 82, y: 40, cluster: "hub", label: "About Me", icon: "/assets/divider-icon-3.svg" },
  { node: "contact", href: "/about/contact", x: 87, y: 68, cluster: "about", label: "Contact" },
];

// Zoom-target center (fraction of container 0..1) + fill scale per
// cluster, derived from where that cluster's own waypoints sit above.
export const zoomTargets = {
  experience: { fx: 0.22, fy: 0.62, scale: 1.5 },
  projects: { fx: 0.56, fy: 0.68, scale: 1.55 },
  about: { fx: 0.845, fy: 0.5, scale: 1.7 },
};
