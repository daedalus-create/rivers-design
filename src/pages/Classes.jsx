import PageHero from "../components/PageHero";
import Breadcrumbs from "../components/Breadcrumbs";
import EntryList from "../components/EntryList";
import { classes } from "../data/classes";

export default function Classes() {
  return (
    <>
      <PageHero
        eyebrow={<Breadcrumbs node="classes" />}
        title="Classes"
        lede="Every class taken at RPI toward the Mechanical and Aerospace Engineering degree."
      />
      {/* Classes have no page of their own, so the cards do not link. */}
      <EntryList entries={classes} linkable={false} ariaLabel="Classes" />
    </>
  );
}
