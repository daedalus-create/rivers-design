// Auto-generated from content/education.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run `npm run import-content`.

export const education = [
  {
    slug: "rpi",
    num: "01",
    title: "Rensselaer Polytechnic Institute",
    sub: "B.S. Mechanical Dual Aerospace Engineering, Troy, NY",
    model: "campus",
    desc: "Bachelor of Science in Mechanical Dual Aerospace Engineering at Rensselaer Polytechnic Institute, completed May 2026.",
    body: [
      "Studied Mechanical Dual Aerospace Engineering at RPI from August 2022, graduating in May 2026.",
      "Coursework focused on manufacturing processes, systems design, and propulsion. See Classes for the full list of courses.",
    ],
    highlights: [
      { k: "Manufacturing", v: "Manufacturing Processes" },
      { k: "Lab", v: "Systems Laboratory 1" },
      { k: "Capstone", v: "Space Vehicle Design Capstone" },
      { k: "Design", v: "Numerical Design Optimization" },
      { k: "Aerospace", v: "Propulsion Systems" },
    ],
    specs: [
      { k: "Degree", v: "B.S. Mechanical Dual Aerospace Engineering" },
      { k: "Dates", v: "August 2022 to May 2026" },
      { k: "Location", v: "Troy, NY" },
    ],
  },
  {
    slug: "waynflete",
    num: "02",
    title: "Waynflete",
    sub: "Secondary school, Portland, ME",
    model: "schoolhouse",
    desc: "Secondary school at Waynflete in Portland, Maine, where Astrophysics and Advanced Biology were the standout courses.",
    body: [
      "Placeholder: a sentence or two on your time at Waynflete. What you were involved in outside class, and what pointed you toward engineering.",
      "Astrophysics and Advanced Biology were the courses that stuck. Placeholder: add what each one covered and what you took from it.",
    ],
    highlights: [
      { k: "Physics", v: "Astrophysics" },
      { k: "Biology", v: "Advanced Biology" },
    ],
    specs: [
      { k: "School", v: "Waynflete" },
      { k: "Dates", v: "Placeholder: years attended" },
      { k: "Location", v: "Portland, ME" },
    ],
  },
];

export const getEducationEntry = (slug) => education.find((e) => e.slug === slug);
