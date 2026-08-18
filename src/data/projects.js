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
      { k: "Status", v: "Placeholder — write-up in progress" },
      { k: "Process", v: "Designed for additive manufacturing" },
      { k: "Focus", v: "Part consolidation / DFM" },
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
export const plannedProjects = projects.filter((p) => p.status === "planned");
export const getProject = (slug) => projects.find((p) => p.slug === slug);
