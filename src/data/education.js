// Auto-generated from content/education.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run `npm run import-content`.

export const education = [
  {
    slug: "rpi",
    num: "01",
    title: "Rensselaer Polytechnic Institute",
    sub: "B.S. Mechanical and Aerospace Engineering, Troy, NY",
    model: "campus",
    desc: "Bachelor of Science in Mechanical and Aerospace Engineering at Rensselaer Polytechnic Institute, completed May 2026.",
    body: [
      "Studied Mechanical and Aerospace Engineering at RPI from August 2022, graduating in May 2026.",
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
      { k: "Degree", v: "B.S. Mechanical and Aerospace Engineering" },
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
    desc: "Secondary school at Waynflete in Portland, Maine, from 2009 to 2022, graduating Summa Cum Laude, with Astrophysics and Advanced Biology as the standout courses.",
    body: [
      "I was at Waynflete in Portland, ME from 2009 through 2022, and graduated Summa Cum Laude. Outside of class most of my time went to the stage crew, three years of it as Stage Manager, which is where I learned to plan a build backwards from the date it has to work.",
      "Astrophysics and Advanced Biology were the courses that stuck. Placeholder: add what each one covered and what you took from it.",
    ],
    highlights: [
      { k: "Physics", v: "Astrophysics" },
      { k: "Biology", v: "Advanced Biology" },
    ],
    specs: [
      { k: "School", v: "Waynflete" },
      { k: "Dates", v: "2009 to 2022" },
      { k: "Location", v: "Portland, ME" },
      { k: "Honors", v: "Summa Cum Laude" },
    ],
  },
];

export const getEducationEntry = (slug) => education.find((e) => e.slug === slug);

// The Experience hub previews the first two schools.
export const HIGHLIGHT_COUNT = 2;
export const educationHighlights = education.slice(0, HIGHLIGHT_COUNT);
