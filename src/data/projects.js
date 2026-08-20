// Individual project pages are data-driven off this array — one
// entry, one page, reached via /projects/:slug (see ProjectDetail.jsx).

export const projects = [
  {
    slug: "pyro-mk7",
    status: "completed",
    num: "01",
    title: "Pyro MK:7",
    sub: "A jet engine designed for additive manufacturing",
    model: "engine",
    specs: [
      { k: "Status", v: "Design concept — CAD complete" },
      { k: "Process", v: "Designed to be manufactured purely with additive techniques" },
      { k: "Focus", v: "Uses gas expansion of incoming fuel to aid airflow through the engine" },
      { k: "Model", v: "CAD export coming soon" },
    ],
  },
  {
    slug: "hephaestus-forge",
    status: "completed",
    num: "02",
    title: "Hephaestus Forge",
    sub: "An automated additive manufacturing assembly line",
    model: "forge",
    specs: [
      { k: "Status", v: "Placeholder — write-up in progress" },
      { k: "Scope", v: "Automation / material handling" },
      { k: "Focus", v: "Lights-out additive production" },
      { k: "Model", v: "CAD export coming soon" },
    ],
  },
  {
    slug: "orbital-maneuver-solver",
    status: "completed",
    num: "03",
    title: "Orbital Maneuver Solver",
    sub: "A Python tool for exploring orbital-maneuver dynamics",
    model: "concept",
    specs: [
      { k: "Language", v: "Python" },
      { k: "Focus", v: "Orbital dynamics / maneuver formulas" },
      { k: "Goal", v: "Demonstrate the usability of key orbital-mechanics formulas" },
    ],
  },
  {
    slug: "wip-1",
    status: "in-progress",
    num: "01",
    title: "Project Build — TBD",
    sub: "Placeholder — name the build currently on the bench",
    model: "concept",
    specs: [
      { k: "Stage", v: "In fabrication / testing" },
      { k: "Next", v: "First powered test" },
      { k: "Notes", v: "Placeholder — build log, BOM, test data" },
    ],
  },
  {
    slug: "plan-1",
    status: "planned",
    num: "01",
    title: "Project Plan — TBD",
    sub: "Placeholder — name the next build and give it one line",
    model: "concept",
    specs: [
      { k: "Stage", v: "Concept / CAD in progress" },
      { k: "Next", v: "First prototype" },
      { k: "Notes", v: "Placeholder — plan, sketches, BOM" },
    ],
  },
  {
    slug: "plan-2",
    status: "planned",
    num: "02",
    title: "Project Plan — TBD",
    sub: "Placeholder — a second in-progress idea lives here",
    model: "concept",
    specs: [
      { k: "Stage", v: "Research / early sketches" },
      { k: "Next", v: "Feasibility check" },
      { k: "Notes", v: "Placeholder — plan, sketches, BOM" },
    ],
  },
];

export const completedProjects = projects.filter((p) => p.status === "completed");
export const inProgressProjects = projects.filter((p) => p.status === "in-progress");
export const plannedProjects = projects.filter((p) => p.status === "planned");
export const getProject = (slug) => projects.find((p) => p.slug === slug);
