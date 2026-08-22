import PageHero from "../components/PageHero";
import EntryList from "../components/EntryList";
import Divider from "../components/Divider";
import { education } from "../data/education";

export default function Education() {
  return (
    <>
      <PageHero
        eyebrow="Rivers Design / Experience"
        title="Education"
        lede="A B.S. in Mechanical Dual Aerospace Engineering from Rensselaer Polytechnic Institute, completed May 2026, and secondary school at Waynflete before it."
      />
      <EntryList
        entries={education}
        basePath="/experience"
        viewerTag="3D Placeholder / Info & pics pending"
        linkLabel="Full write-up"
        ariaLabel="Education"
      />
      <Divider
        to="/experience/classes"
        label="Classes"
        iconLeft="/assets/divider-icon-3.svg"
        iconRight="/assets/divider-icon-2.svg"
        flip
      />
    </>
  );
}
