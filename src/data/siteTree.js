// The site's navigation graph: one entry per real page, plus the
// parent/child relationships the menu branches along.
//
// This is the single hand-authored source for what pages exist and how
// they nest, read by the branching menu (MenuTree.jsx).
//
// `cluster` names the parent's node id, or "hub" for a top-level section.
// "home" is listed for completeness, but the menu shows only the three
// sections a reader navigates into: the logo is home.

export const NAV = [
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
  { node: "waynflete", href: "/experience/waynflete", cluster: "education", label: "Waynflete" },

  { node: "projects", href: "/projects", cluster: "hub", label: "Projects" },
  { node: "completed", href: "/projects/completed", cluster: "projects", label: "Completed" },
  { node: "pyro-mk7", href: "/projects/pyro-mk7", cluster: "completed", label: "Pyro MK:7" },
  { node: "hephaestus-forge", href: "/projects/hephaestus-forge", cluster: "completed", label: "G.A.S." },
  { node: "orbital-maneuver-solver", href: "/projects/orbital-maneuver-solver", cluster: "completed", label: "Orbital Solver" },
  { node: "in-progress", href: "/projects/in-progress", cluster: "projects", label: "In Progress" },
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
  { node: "plant-exoskeleton", href: "/projects/plant-exoskeleton", cluster: "planned", label: "Exoskeleton" },
  { node: "envisage", href: "/projects/envisage", cluster: "planned", label: "Envisage" },

  { node: "about", href: "/about", cluster: "hub", label: "About" },
  { node: "contact", href: "/about/contact", cluster: "about", label: "Contact" },
];

const BY_NODE = new Map(NAV.map((n) => [n.node, n]));

export const getNavNode = (node) => BY_NODE.get(node);

/** Direct children of a node id, in NAV order. */
export const childrenOf = (node) => NAV.filter((n) => n.cluster === node);

/** The three sections the menu opens with. Home is reached via the logo. */
export const rootSections = () => NAV.filter((n) => n.cluster === "hub" && n.node !== "home");

/** Ancestor chain for a node, outermost first, excluding the node itself. */
export function ancestorsOf(node) {
  const chain = [];
  let current = BY_NODE.get(node);
  while (current && current.cluster !== "hub") {
    current = BY_NODE.get(current.cluster);
    if (current) chain.unshift(current.node);
  }
  return chain;
}

/** The node whose page is at `pathname`, if any. */
export const nodeForPath = (pathname) => NAV.find((n) => n.href === pathname);
