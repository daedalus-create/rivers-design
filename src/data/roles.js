// Work-excerpt role write-ups. Summarized on /experience/work-excerpts
// and the home page, with each role getting its own page at
// /experience/:slug (see RoleDetail.jsx).

export const roles = [
  {
    slug: "sunthru",
    num: "01",
    org: "SunThru",
    title: "SunThru:",
    sub: "Aerogel monolith manufacturer",
    model: "panel",
    desc: "Placeholder — one or two sentences on the role: what SunThru makes, what you own there day to day, and the kind of engineering problems you get to solve.",
    body: [
      "Placeholder — describe what you build and own at SunThru: the processes, the rigs, the numbers. Open with what the company does and what you actually did there, written plainly.",
      "Placeholder — a second paragraph for the details worth keeping: the problem you were handed, the approach you took, and what shipped because of it. There’s room here for the full story, so don’t compress it.",
      "Placeholder — close with results. Numbers read best: cost saved, time cut, throughput gained, or whatever the work moved.",
    ],
    specs: [
      { k: "Role", v: "Placeholder — title / dates TBD" },
      { k: "Field", v: "Silica aerogel manufacturing" },
      { k: "Focus", v: "Process / test engineering" },
    ],
  },
  {
    slug: "dreki",
    num: "02",
    org: "Dreki Systems",
    title: "Dreki Systems:",
    sub: "Manufacturing, machining, and CAD across two stints — Castleton, NY / Tysons Corner, VA",
    model: "concept",
    desc: "Two stints at Dreki Systems — an engineering shop internship in 2024, then a junior design engineering role in 2025 — spanning fabrication, precision machining, and CAD design for rapid prototyping.",
    body: [
      "As an Engineering Shop Intern in Castleton, NY (June–August 2024), I developed templates from engineering drawings to improve machining accuracy on steel components, and helped fabricate a ladder and ladder cage used to improve worker safety during bridge repairs across New York and the surrounding area.",
      "I returned in 2025 as a Junior Design Engineer in Tysons Corner, VA (May–August 2025), establishing manufacturing systems to support rapid prototyping and designing components in CAD across a range of engineering projects, working alongside senior engineers to develop new design solutions.",
    ],
    specs: [
      { k: "Roles", v: "Engineering Shop Intern (2024) → Junior Design Engineer (2025)" },
      { k: "Field", v: "Manufacturing / rapid prototyping" },
      { k: "Focus", v: "CAD design, machining templates, fabrication" },
    ],
  },
  {
    slug: "work-study",
    num: "03",
    org: "Student Living & Learning, RPI",
    title: "Student Living & Learning:",
    sub: "Work Study — Troy, NY",
    model: "concept",
    desc: "Supporting RPI's Assistant Deans with day-to-day operations and fielding parent questions about students' time on campus.",
    body: [
      "Since September 2024, I've worked as a Work Study student with RPI's Office of Student Living and Learning in Troy, NY, aiding the Assistant Deans with day-to-day tasks that keep the office running and help ensure student success.",
      "A large part of the role is direct communication — answering questions from parents about their students' time on campus, and making sure issues get routed to the right person quickly.",
    ],
    specs: [
      { k: "Role", v: "Work Study, September 2024 – Current" },
      { k: "Office", v: "Student Living and Learning, RPI" },
      { k: "Focus", v: "Student support / parent communication" },
    ],
  },
];

export const getRole = (slug) => roles.find((r) => r.slug === slug);
