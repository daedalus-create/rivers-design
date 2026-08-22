// Turns the content spreadsheets into the data the site reads.
//
//   content/projects.csv    ->  src/data/projects.js
//   content/experience.csv  ->  src/data/roles.js
//   content/education.csv   ->  src/data/education.js
//   content/classes.csv     ->  src/data/classes.js
//
// Edit the CSVs in Excel, Numbers, or Google Sheets, then run
// `npm run import-content`. Adding a project means adding a row.
//
// Every sheet uses the SAME columns, so the format only has to be
// learned once; a section simply leaves the ones it does not use empty.
// Classes, for instance, fill in slug/title/sub/desc and nothing else.
//
// Display numbers are NOT a column. They come from row order — and for
// projects, from row order within a status — because hand-maintained
// numbering goes stale the moment an entry is removed from the middle.
//
// Run: npm run import-content
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { BUILDERS } from "../src/components/modelBuilders.js";

const SPECS = 6, BODY = 4, HLS = 6;

const SHEETS = [
  { csv: "projects", out: "projects.js", export: "projects", needsStatus: true },
  { csv: "experience", out: "roles.js", export: "roles" },
  { csv: "education", out: "education.js", export: "education" },
  { csv: "classes", out: "classes.js", export: "classes", plain: true },
];

const STATUSES = ["completed", "in-progress", "planned"];

// ---------- CSV ----------
// Hand-rolled rather than a dependency: the format is small, and a
// parser that handles quoted fields and embedded commas/newlines is
// about fifteen lines. Follows RFC 4180.
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const src = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

function readSheet(sheet) {
  const path = `content/${sheet.csv}.csv`;
  if (!existsSync(path)) {
    fail(path, "missing");
    return [];
  }
  const rows = parseCSV(readFileSync(path, "utf8"));
  const header = rows.shift().map((h) => h.trim());
  const seen = new Set();

  return rows.map((cells, n) => {
    const at = `${path} row ${n + 2}`;
    const get = (col) => {
      const i = header.indexOf(col);
      return i === -1 ? "" : (cells[i] ?? "").trim();
    };

    const slug = get("slug");
    if (!slug) fail(at, "no slug");
    if (seen.has(slug)) fail(at, `duplicate slug "${slug}"`);
    seen.add(slug);
    if (!get("title")) fail(at, `"${slug}" has no title`);

    const pairs = (prefix, count) =>
      Array.from({ length: count }, (_, i) => ({
        k: get(`${prefix}${i + 1}_key`),
        v: get(`${prefix}${i + 1}_value`),
      })).filter((p) => p.k || p.v);

    // A key with no value (or the reverse) is a half-filled cell, which
    // would render as an empty row rather than fail loudly.
    for (const [label, list] of [["spec", pairs("spec", SPECS)], ["highlight", pairs("highlight", HLS)]]) {
      list.forEach((p, i) => {
        if (!p.k || !p.v) fail(at, `"${slug}" ${label} ${i + 1} has a key or value but not both`);
      });
    }

    const entry = {
      slug,
      title: get("title"),
      sub: get("sub"),
      specs: pairs("spec", SPECS),
    };

    const status = get("status");
    if (sheet.needsStatus) {
      if (!STATUSES.includes(status)) fail(at, `"${slug}" status must be one of ${STATUSES.join(", ")}, got "${status}"`);
      entry.status = status;
    } else if (status) {
      fail(at, `"${slug}" has a status, but only projects use that column`);
    }

    if (!sheet.plain) {
      const model = get("model") || "concept";
      if (!BUILDERS[model]) fail(at, `"${slug}" model "${model}" has no builder in modelBuilders.js`);
      entry.model = model;
    }

    const desc = get("desc");
    if (desc) entry.desc = desc;

    const body = Array.from({ length: BODY }, (_, i) => get(`body${i + 1}`)).filter(Boolean);
    if (body.length) entry.body = body;

    const highlights = pairs("highlight", HLS);
    if (highlights.length) entry.highlights = highlights;

    return entry;
  });
}

// ---------- emit ----------
const q = (s) => JSON.stringify(s);

function renderEntry(e, num, indent = "  ") {
  const L = [`${indent}{`];
  const put = (k, v) => L.push(`${indent}  ${k}: ${v},`);
  put("slug", q(e.slug));
  if (e.status) put("status", q(e.status));
  put("num", q(num));
  put("title", q(e.title));
  put("sub", q(e.sub));
  if (e.model) put("model", q(e.model));
  if (e.desc) put("desc", q(e.desc));
  if (e.body) {
    L.push(`${indent}  body: [`);
    e.body.forEach((b) => L.push(`${indent}    ${q(b)},`));
    L.push(`${indent}  ],`);
  }
  for (const key of ["highlights", "specs"]) {
    const list = e[key];
    if (!list || !list.length) continue;
    L.push(`${indent}  ${key}: [`);
    list.forEach((p) => L.push(`${indent}    { k: ${q(p.k)}, v: ${q(p.v)} },`));
    L.push(`${indent}  ],`);
  }
  L.push(`${indent}},`);
  return L.join("\n");
}

const pad = (n) => String(n).padStart(2, "0");

const HEADERS = {
  "projects.js": `// Auto-generated from content/projects.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run \`npm run import-content\`.
//
// \`num\` comes from row order within each status, so removing an entry
// renumbers the rest automatically.`,
  "roles.js": `// Auto-generated from content/experience.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run \`npm run import-content\`.`,
  "education.js": `// Auto-generated from content/education.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run \`npm run import-content\`.`,
  "classes.js": `// Auto-generated from content/classes.csv by tools/import-content.mjs.
// Do not hand-edit: edit the spreadsheet and run \`npm run import-content\`.`,
};

const FOOTERS = {
  "projects.js": `
export const completedProjects = projects.filter((p) => p.status === "completed");
export const inProgressProjects = projects.filter((p) => p.status === "in-progress");
export const plannedProjects = projects.filter((p) => p.status === "planned");
export const getProject = (slug) => projects.find((p) => p.slug === slug);

// The Projects hub previews the first two entries of each section.
export const HIGHLIGHT_COUNT = 2;
export const highlightsFor = (status) =>
  projects.filter((p) => p.status === status).slice(0, HIGHLIGHT_COUNT);
`,
  "roles.js": `
export const getRole = (slug) => roles.find((r) => r.slug === slug);
`,
  "education.js": `
export const getEducationEntry = (slug) => education.find((e) => e.slug === slug);
`,
  "classes.js": "",
};

let wrote = 0;
for (const sheet of SHEETS) {
  const entries = readSheet(sheet);
  if (problems.length) continue;

  // numbering: per status for projects, otherwise per file
  const counters = new Map();
  const numbered = entries.map((e) => {
    const group = e.status || "_";
    const n = (counters.get(group) || 0) + 1;
    counters.set(group, n);
    return [e, pad(n)];
  });

  const body = [
    HEADERS[sheet.out],
    "",
    `export const ${sheet.export} = [`,
    ...numbered.map(([e, n]) => renderEntry(e, n)),
    "];",
    FOOTERS[sheet.out],
  ].join("\n");

  writeFileSync(`src/data/${sheet.out}`, body.replace(/\n+$/, "\n"), "utf8");
  wrote++;
  const counts = [...counters].map(([k, v]) => (k === "_" ? `${v}` : `${v} ${k}`)).join(", ");
  console.log(`  ${sheet.csv}.csv -> src/data/${sheet.out}  (${counts})`);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s) in the content sheets:\n`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log(`\n${wrote} data files written from content/.`);
