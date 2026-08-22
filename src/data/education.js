// Education write-ups — same list/detail pattern as work-excerpt roles.
// Summarized on /experience/education, with each entry getting its own
// page at /experience/:slug (see ExperienceDetail.jsx).

export const education = [
  {
    slug: "rpi",
    num: "01",
    org: "Rensselaer Polytechnic Institute",
    title: "Rensselaer Polytechnic Institute:",
    sub: "B.S. Mechanical Dual Aerospace Engineering — Troy, NY",
    model: "campus",
    desc: "Bachelor of Science in Mechanical Dual Aerospace Engineering at Rensselaer Polytechnic Institute, expected May 2026.",
    body: [
      "Studying Mechanical Dual Aerospace Engineering at RPI since August 2022, with an expected graduation of May 2026.",
      "Coursework has focused on manufacturing processes, systems design, and propulsion — see Classes for the full list of highlighted courses.",
    ],
    specs: [
      { k: "Degree", v: "B.S. Mechanical Dual Aerospace Engineering" },
      { k: "Dates", v: "August 2022 – Projected Graduation: May 2026" },
      { k: "Location", v: "Troy, NY" },
    ],
  },
];

export const getEducationEntry = (slug) => education.find((e) => e.slug === slug);
