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
  { node: "work-study", href: "/experience/work-study", x: 11.4, y: 67.9, cluster: "work", label: "Work Study" },
  { node: "piasecki-steel", href: "/experience/piasecki-steel", x: 40.7, y: 63.1, cluster: "work", label: "Piasecki Steel" },
  { node: "resume", href: "/experience/resume", x: 30.7, y: 83.3, cluster: "experience", label: "Resume" },
  { node: "education", href: "/experience/education", x: 29.3, y: 88.1, cluster: "experience", label: "Education" },
  { node: "rpi", href: "/experience/rpi", x: 21.4, y: 89.3, cluster: "education", label: "RPI" },
  { node: "classes", href: "/experience/classes", x: 33.6, y: 97.5, cluster: "education", label: "Classes" },
  { node: "projects", href: "/projects", x: 58.9, y: 44.7, cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", x: 32.1, y: 88.1, cluster: "projects", label: "Completed" },
  { node: "pyro-mk7", href: "/projects/pyro-mk7", x: 21.4, y: 72.6, cluster: "completed", label: "Pyro MK:7" },
  { node: "hephaestus-forge", href: "/projects/hephaestus-forge", x: 54.3, y: 72.6, cluster: "completed", label: "Hephaestus Forge" },
  { node: "orbital-maneuver-solver", href: "/projects/orbital-maneuver-solver", x: 35.0, y: 60.7, cluster: "completed", label: "Orbital Maneuver Solver" },
  { node: "in-progress", href: "/projects/in-progress", x: 50.0, y: 95.2, cluster: "projects", label: "Work in Progress" },
  { node: "cycloidal-extruder", href: "/projects/cycloidal-extruder", x: 51.4, y: 84.5, cluster: "in-progress", label: "Extruder" },
  { node: "blended-body-aircraft", href: "/projects/blended-body-aircraft", x: 71.4, y: 83.3, cluster: "in-progress", label: "Blended Body" },
  { node: "cm5-cluster", href: "/projects/cm5-cluster", x: 35.7, y: 90.5, cluster: "in-progress", label: "CM5 Cluster" },
  { node: "planned", href: "/projects/planned", x: 80.0, y: 57.1, cluster: "projects", label: "Planned" },
  { node: "axial-flux-motor", href: "/projects/axial-flux-motor", x: 97.9, y: 38.1, cluster: "planned", label: "Axial Motor" },
  { node: "electric-thruster", href: "/projects/electric-thruster", x: 98.5, y: 64.3, cluster: "planned", label: "Thruster" },
  { node: "cycloidal-linear-actuator", href: "/projects/cycloidal-linear-actuator", x: 69.3, y: 76.2, cluster: "planned", label: "Actuator" },
  { node: "omni-stud-drive", href: "/projects/omni-stud-drive", x: 98.5, y: 97.5, cluster: "planned", label: "Stud Drive" },
  { node: "ruby-graphite-bearing", href: "/projects/ruby-graphite-bearing", x: 83.6, y: 77.4, cluster: "planned", label: "Ruby Bearing" },
  { node: "ring-air-bearing", href: "/projects/ring-air-bearing", x: 80.7, y: 86.9, cluster: "planned", label: "Air Bearing" },
  { node: "passive-magnetic-bearing", href: "/projects/passive-magnetic-bearing", x: 70.0, y: 66.7, cluster: "planned", label: "Mag Bearing" },
  { node: "plant-exoskeleton", href: "/projects/plant-exoskeleton", x: 80.0, y: 44.0, cluster: "planned", label: "Exoskeleton" },
  { node: "envisage", href: "/projects/envisage", x: 87.9, y: 52.4, cluster: "planned", label: "Envisage" },
  { node: "land-trust-city", href: "/projects/land-trust-city", x: 70.0, y: 52.4, cluster: "planned", label: "Trust City" },
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
  experience: { fx: 0.271, fy: 0.784, scale: 3.2 },
  projects: { fx: 0.56, fy: 0.647, scale: 1.52 },
  about: { fx: 0.758, fy: 0.571, scale: 3.2 },
  completed: { fx: 0.378, fy: 0.609, scale: 1.96 },
  "in-progress": { fx: 0.536, fy: 0.684, scale: 1.86 },
  planned: { fx: 0.638, fy: 0.633, scale: 1.41 },
  work: { fx: 0.292, fy: 0.686, scale: 2.01 },
  education: { fx: 0.275, fy: 0.831, scale: 3.2 },
};
