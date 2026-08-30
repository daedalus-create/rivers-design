import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Divider from "../components/Divider";
import Letters from "../components/Letters";
import SpecList from "../components/SpecList";
import Timeline from "../components/Timeline";
import { timelineEntries } from "../data/timeline";
import { education } from "../data/education";

// The page is the timeline. Work and school are one chronology rather
// than two lists, which is the only way the overlap shows: RPI runs
// underneath four of the jobs, and Waynflete underneath the stage crew.
//
// After it, the two things a chronology cannot carry: the courses that
// mattered, which belong to a degree rather than to a point in time, and
// the resume, which is the whole thing on one page.
const rpi = education.find((e) => e.slug === "rpi");

export default function Experience() {
  return (
    <>
      <section className="page-hero wrap">
        <Reveal as="p" className="meta meta--wide">
          Rivers Design / Where I&rsquo;ve worked
        </Reveal>
        <Reveal as="h1" className="display" stagger={1}>
          Experience
        </Reveal>
        <Reveal as="p" className="lede" stagger={2}>
          Every job and every school, newest first, from a manufacturing floor back to a school stage crew.
          Each one opens as you reach it.
        </Reveal>
      </section>

      <section className="section--tight wrap" aria-label="Work and education history">
        <Timeline
          entries={timelineEntries}
          basePath="/experience"
        />
      </section>

      <Divider
        to="/experience/classes"
        label="Classes"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />

      <section className="section--tight wrap" aria-label="Highlighted classes">
        <Reveal>
          <SpecList items={rpi?.highlights} label="Highlighted classes" />
        </Reveal>

        <Reveal stagger={1}>
          <Link className="link-arrow" to="/experience/classes">
            <Letters text="Every class" /> <span className="arr">&rarr;</span>
          </Link>
        </Reveal>
      </section>

      <Divider to="/experience/resume" label="Resume" />
    </>
  );
}
