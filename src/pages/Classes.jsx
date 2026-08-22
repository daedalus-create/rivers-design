import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import { classes } from "../data/classes";

export default function Classes() {
  return (
    <>
      <PageHero
        eyebrow={
          <>
            Rivers Design / Experience /{" "}
            <Link to="/experience/education" style={{ color: "inherit" }}>
              Education
            </Link>
          </>
        }
        title="Classes"
        lede="Every class taken at RPI toward the Mechanical Dual Aerospace Engineering degree."
      />
      {/* Classes have no page of their own, so the cards do not link. */}
      <EntryList entries={classes} linkable={false} ariaLabel="Classes" />
    </>
  );
}
