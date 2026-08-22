// Auto-generated from content/projects.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run `npm run import-content`.
//
// `num` comes from row order within each status, so removing an entry
// renumbers the rest automatically.

export const projects = [
  {
    slug: "pyro-mk7",
    status: "completed",
    num: "01",
    title: "Pyro MK:7",
    sub: "A jet engine designed for additive manufacturing",
    model: "engine",
    specs: [
      { k: "Status", v: "Design concept, CAD complete" },
      { k: "Process", v: "Designed to be manufactured purely with additive techniques" },
      { k: "Focus", v: "Uses gas expansion of incoming fuel to aid airflow through the engine" },
    ],
  },
  {
    slug: "hephaestus-forge",
    status: "completed",
    num: "02",
    title: "G.A.S. [Core XY System]",
    sub: "An automated additive manufacturing assembly line",
    model: "forge",
    specs: [
      { k: "Status", v: "Placeholder: write-up in progress" },
      { k: "Accuracy", v: "0.2 mm dimensional" },
      { k: "Scope", v: "Automation / material handling" },
      { k: "Focus", v: "Lights-out additive production" },
    ],
  },
  {
    slug: "orbital-maneuver-solver",
    status: "completed",
    num: "03",
    title: "Orbital Maneuver Solver",
    sub: "A Python tool for exploring orbital-maneuver dynamics",
    model: "orbit",
    specs: [
      { k: "Language", v: "Python" },
      { k: "Focus", v: "Orbital dynamics / maneuver formulas" },
      { k: "Goal", v: "Demonstrate the usability of key orbital-mechanics formulas" },
    ],
  },
  {
    slug: "integrated-toolhead",
    status: "in-progress",
    num: "01",
    title: "Integrated Toolhead",
    sub: "A 3D printer toolhead designed as one assembly instead of a stack of parts",
    model: "toolhead",
    specs: [
      { k: "Stage", v: "Detail design, drawings and preliminary BOM complete" },
      { k: "Problem", v: "Toolheads fail in predictable places: ground filament, thermal limits, cable fatigue" },
      { k: "Approach", v: "One integrated design instead of patching each failure mode" },
      { k: "Next", v: "Prototype build and validation" },
    ],
  },
  {
    slug: "blended-body-aircraft",
    status: "in-progress",
    num: "02",
    title: "Blended Body Aircraft",
    sub: "Resolving the engine-placement compromise that has held back blended wing body designs",
    model: "bwb",
    specs: [
      { k: "Stage", v: "Concept finalized, configuration locked, test plan drafted" },
      { k: "Problem", v: "A blended body has nowhere clean to hang an engine" },
      { k: "Approach", v: "Reshape the airframe so engines mount conventionally" },
      { k: "Open threads", v: "Low-speed yaw control, systems integration" },
    ],
  },
  {
    slug: "cm5-cluster",
    status: "in-progress",
    num: "03",
    title: "CM5 Cluster Compute Platform",
    sub: "A dense compute cluster for evolutionary computation and neural network work",
    model: "carrier",
    specs: [
      { k: "Stage", v: "Carrier board design, second revision" },
      { k: "Problem", v: "No dense Compute Module 5 carrier exists on the market" },
      { k: "Why", v: "Genetic algorithms are embarrassingly parallel, so many small nodes suit them" },
      { k: "Next", v: "Fabrication and single-board bring-up" },
    ],
  },
  {
    slug: "high-speed-motor",
    status: "planned",
    num: "01",
    title: "High-Speed Motor",
    sub: "A motor built to stay stable at speeds that shake conventional designs apart",
    model: "ringmotor",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "Center-supported rotors turn any eccentricity into vibration at speed" },
      { k: "Goal", v: "One pipeline, motors tunable for generation, torque, or propulsion" },
      { k: "Next", v: "Electromagnetic sizing and bearing selection" },
    ],
  },
  {
    slug: "electric-thruster",
    status: "planned",
    num: "02",
    title: "Multi-Stage Electric Thruster",
    sub: "Extracting more thrust from a given duct diameter than a single-stage fan can",
    model: "thruster",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "One blade row can only do so much work before the flow separates" },
      { k: "Approach", v: "Spread the pressure rise across matched stages" },
      { k: "Depends on", v: "The motor and bearing work, one link in a motor-to-airframe chain" },
    ],
  },
  {
    slug: "precision-linear-stage",
    status: "planned",
    num: "03",
    title: "Precision Linear Stage",
    sub: "Precision that holds without a feedback loop correcting it",
    model: "linearstage",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "Every conventional linear drive has backlash to correct for" },
      { k: "Goal", v: "Inherent precision with no encoders and no tuning" },
      { k: "Open question", v: "Whether achievable speed suits the target applications" },
    ],
  },
  {
    slug: "omnidirectional-base",
    status: "planned",
    num: "04",
    title: "Omnidirectional Robot Base",
    sub: "An omnidirectional robot base that cannot slip",
    model: "studbase",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "Mobile bases trade away precision, load capacity, or direction" },
      { k: "Goal", v: "Repeatable positioning with no accumulated slip" },
      { k: "For", v: "Additive manufacturing, CNC work, precision docking" },
    ],
  },
  {
    slug: "high-temperature-bearing",
    status: "planned",
    num: "05",
    title: "High-Temperature Bearing",
    sub: "A bearing for temperatures and pressures that destroy conventional ones",
    model: "bearing",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "Steel bearings are limited by their lubricant; ceramics are costly and brittle" },
      { k: "Goal", v: "High-temperature operation with no liquid lubricant at all" },
      { k: "Role", v: "The small-scale bearing option for the motor and thruster" },
    ],
  },
  {
    slug: "large-diameter-air-bearing",
    status: "planned",
    num: "06",
    title: "Large-Diameter Air Bearing",
    sub: "Air-film support for a geometry conventional bearings do not fit",
    model: "airbearing",
    specs: [
      { k: "Stage", v: "Concept / research" },
      { k: "Problem", v: "Air bearings are built for shafts and flat faces, not this geometry" },
      { k: "Goal", v: "Uniform support pressure across the whole bearing face" },
      { k: "Role", v: "A bearing option for the ring-drive motor" },
    ],
  },
  {
    slug: "plant-exoskeleton",
    status: "planned",
    num: "07",
    title: "Modular Plant Exoskeleton",
    sub: "A self-watering enclosure that treats a potted plant as a design object",
    model: "planter",
    specs: [
      { k: "Stage", v: "Concept" },
      { k: "Problem", v: "Plant products are functional and ugly, or decorative and useless" },
      { k: "Goal", v: "Not a growing station, but an object with presence" },
      { k: "Scope", v: "Modular, 3D printed, indoor or full weather" },
    ],
  },
  {
    slug: "envisage",
    status: "planned",
    num: "08",
    title: "Envisage",
    sub: "A procedurally generated galaxy shared by three games that look unrelated",
    model: "galaxy",
    specs: [
      { k: "Stage", v: "Design document, 17 module specs drafted" },
      { k: "Concept", v: "An RPG, a sandbox, and a simulation, sold apart, secretly one universe" },
      { k: "Generation", v: "Stars, life, languages, and histories built before anyone logs in" },
      { k: "Philosophy", v: "Geometry and physics over hand-authoring" },
    ],
  },
];

export const completedProjects = projects.filter((p) => p.status === "completed");
export const inProgressProjects = projects.filter((p) => p.status === "in-progress");
export const plannedProjects = projects.filter((p) => p.status === "planned");
export const getProject = (slug) => projects.find((p) => p.slug === slug);

// The Projects hub previews the first two entries of each section.
export const HIGHLIGHT_COUNT = 2;
export const highlightsFor = (status) =>
  projects.filter((p) => p.status === status).slice(0, HIGHLIGHT_COUNT);
