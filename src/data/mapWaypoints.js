// Site-map nav graph — the hand-authored half. One entry per real page.
//
// Positions are NOT here. They live in the generated mapGeometry.js,
// because tools/generate-map.py bends the trail paths in mapTrails.js to
// the same coordinates: when positions were hand-copied into this file,
// the dots and their own trails could silently drift apart. The script
// owns geometry, this file owns meaning — node, href, cluster, label.
//
// cluster "hub" = always visible (Home, Experience, Projects, About).
// Everything else only shows once its hub is clicked (see MapMenu) —
// two zoom levels deep: hub -> its sub-pages -> (for Completed/Work in
// Progress/Planned/Work Excerpts/Education) individual project, role,
// and education pages.
//
// Hub waypoints can each carry an `icon` path — MapMenu renders it when
// present, just none are set right now (custom icons pending).
//
// To add a waypoint: add it here, add a rough (x%, y%) to
// POSITIONS_INTENT in tools/generate-map.py, then `npm run generate-map`.
// The script reads the `label` below to reserve space for the rendered
// pill, and refuses to run if the two files disagree about which
// waypoints exist.
import { mapPositions, zoomTargets } from "./mapGeometry";

export { zoomTargets };

const NAV = [
  { node: "home", href: "/", cluster: "hub", label: "Home" },
  { node: "experience", href: "/experience", cluster: "hub", label: "Experience" },
  { node: "work", href: "/experience/work-excerpts", cluster: "experience", label: "Work Excerpts" },
  { node: "sunthru", href: "/experience/sunthru", cluster: "work", label: "SunThru" },
  { node: "dreki", href: "/experience/dreki", cluster: "work", label: "Dreki Systems" },
  { node: "work-study", href: "/experience/work-study", cluster: "work", label: "Work Study" },
  { node: "piasecki-steel", href: "/experience/piasecki-steel", cluster: "work", label: "Piasecki Steel" },
  { node: "resume", href: "/experience/resume", cluster: "experience", label: "Resume" },
  { node: "education", href: "/experience/education", cluster: "experience", label: "Education" },
  { node: "rpi", href: "/experience/rpi", cluster: "education", label: "RPI" },
  { node: "classes", href: "/experience/classes", cluster: "education", label: "Classes" },
  { node: "projects", href: "/projects", cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", cluster: "projects", label: "Completed" },
  { node: "pyro-mk7", href: "/projects/pyro-mk7", cluster: "completed", label: "Pyro MK:7" },
  { node: "hephaestus-forge", href: "/projects/hephaestus-forge", cluster: "completed", label: "G.A.S." },
  { node: "orbital-maneuver-solver", href: "/projects/orbital-maneuver-solver", cluster: "completed", label: "Orbital Solver" },
  { node: "in-progress", href: "/projects/in-progress", cluster: "projects", label: "Work in Progress" },
  { node: "integrated-toolhead", href: "/projects/integrated-toolhead", cluster: "in-progress", label: "Toolhead" },
  { node: "blended-body-aircraft", href: "/projects/blended-body-aircraft", cluster: "in-progress", label: "Blended Body" },
  { node: "cm5-cluster", href: "/projects/cm5-cluster", cluster: "in-progress", label: "CM5 Cluster" },
  { node: "planned", href: "/projects/planned", cluster: "projects", label: "Planned" },
  { node: "high-speed-motor", href: "/projects/high-speed-motor", cluster: "planned", label: "Motor" },
  { node: "electric-thruster", href: "/projects/electric-thruster", cluster: "planned", label: "Thruster" },
  { node: "precision-linear-stage", href: "/projects/precision-linear-stage", cluster: "planned", label: "Linear Stage" },
  { node: "omnidirectional-base", href: "/projects/omnidirectional-base", cluster: "planned", label: "Robot Base" },
  { node: "high-temperature-bearing", href: "/projects/high-temperature-bearing", cluster: "planned", label: "Hot Bearing" },
  { node: "large-diameter-air-bearing", href: "/projects/large-diameter-air-bearing", cluster: "planned", label: "Air Bearing" },
  { node: "unpowered-magnetic-bearing", href: "/projects/unpowered-magnetic-bearing", cluster: "planned", label: "Mag Bearing" },
  { node: "plant-exoskeleton", href: "/projects/plant-exoskeleton", cluster: "planned", label: "Exoskeleton" },
  { node: "envisage", href: "/projects/envisage", cluster: "planned", label: "Envisage" },
  { node: "land-trust-city", href: "/projects/land-trust-city", cluster: "planned", label: "Trust City" },
  { node: "about", href: "/about", cluster: "hub", label: "About Me" },
  { node: "contact", href: "/about/contact", cluster: "about", label: "Contact" },
];

// Fail loudly rather than dropping a dot at 0,0 — a waypoint with no
// generated position means mapGeometry.js is stale.
export const mapWaypoints = NAV.map((wp) => {
  const pos = mapPositions[wp.node];
  if (!pos) {
    throw new Error(
      `No generated position for site-map waypoint "${wp.node}" — ` +
        "run `npm run generate-map` to refresh src/data/mapGeometry.js.",
    );
  }
  return { ...wp, x: pos[0], y: pos[1] };
});
