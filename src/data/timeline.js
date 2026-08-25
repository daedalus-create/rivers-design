// Extensions are explicit, unlike the extensionless imports the pages
// use. Vite resolves either, but the scripts in tools/ load src/data
// straight into Node, which does not — and this is the first data module
// that imports another, so it is the first one that has to care.
import { roles } from "./roles.js";
import { education } from "./education.js";

// The Experience page is one chronology, so the two sheets that feed it
// get merged here rather than in the page. Work and school interleave
// because that is what actually happened: RPI runs underneath four of
// the jobs, and splitting them into separate lists would hide it.
//
// Sorted on `start` (YYYY-MM), which exists in the sheets purely to sort
// by — the `date` a reader sees is prose like "Fall 2022 – Present" and
// cannot be compared. Newest first, so the page opens on the most recent
// thing and reads backwards.
//
// `kind` is added here rather than stored: it is not a property of the
// entry, it is which sheet the entry came from, and the timeline uses it
// only to label a row and to pick the right link.

const withKind = (list, kind) => list.map((entry) => ({ ...entry, kind }));

export const timelineEntries = [...withKind(roles, "work"), ...withKind(education, "education")]
  .filter((e) => e.start)
  .sort((a, b) => b.start.localeCompare(a.start));

// Anything missing a `start` would silently vanish from the page above,
// so say so at build time instead. The importer already refuses a `date`
// without a `start`; this catches an entry with neither.
export const untimelined = [...roles, ...education].filter((e) => !e.start);
