import Reveal from "../components/Reveal";
import Letters from "../components/Letters";

// The summary sheet, kept in step with the PDF in public/assets. The rows
// below are transcribed from it and have to move with it whenever it
// changes.
//
// The linked copy is deliberately the address-free one: this repo is
// public and deploys straight to the live site, so whatever sits at that
// path is downloadable by anyone. Phone and email are in it by choice,
// matching what the Contact page already publishes.
const RESUME_PDF = "/assets/deon-rivers-resume.pdf";

const ROWS = [
  { k: "Education", v: "B.S. Mechanical and Aerospace Engineering, RPI, May 2026" },
  { k: "Skills", v: "CAD Modeling / Project Management / Rapid Prototyping / Additive Manufacturing" },
  { k: "Software", v: "Siemens NX / Fusion 360 / Autodesk Inventor / Mastercam / MATLAB / Microsoft Suite / Google Suite" },
  { k: "Shop", v: "3D printing / Manual machining / Wood working / Blacksmithing / Gem cutting" },
  {
    k: "Coursework",
    v: "Manufacturing Processes / Systems Laboratory 1 / Space Vehicle Design Capstone / Numerical Design Optimization / Propulsion Systems",
  },
  {
    k: "Achievements",
    v: "Summa Cum Laude at Waynflete / Founded the Room Manager Union at The Forge / Stage Manager for three years",
  },
];

export default function Resume() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Experience
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Resume
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          A Mechanical / Aerospace engineering graduate of RPI with hands-on manufacturing and CAD experience,
          looking for engineering roles in design, DFM, and additive manufacturing.
        </Reveal>
      </section>

      <section className="section--tight wrap">
        <Reveal as="ul" className="specs">
          {ROWS.map((row) => (
            <li key={row.k}>
              <span className="k">{row.k}</span>
              <span className="v">{row.v}</span>
            </li>
          ))}
        </Reveal>

        <Reveal stagger={1}>
          <a className="link-arrow" href={RESUME_PDF} target="_blank" rel="noreferrer">
            <Letters text="Download the resume" /> <span className="arr">&rarr;</span>
          </a>
        </Reveal>
      </section>
    </>
  );
}
