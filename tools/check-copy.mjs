// Copy guard for user-facing text.
//
// Em-dashes are not wanted in write-ups, and they are easy to reintroduce
// without noticing: they read fine in an editor and only look wrong once
// the page is up. This scans the string values that end up on the page
// and fails the run if one appears, so the rule holds without anyone
// having to remember it.
//
// Code comments are exempt on purpose — the rule is about prose the
// reader sees, not about how the source is annotated.
//
// Run: npm run check-copy
import { readFileSync } from "node:fs";
import { projects } from "../src/data/projects.js";
import { roles } from "../src/data/roles.js";
import { education } from "../src/data/education.js";
import { classes } from "../src/data/classes.js";

const EM_DASH = "—";
const BANNED = [
  { char: EM_DASH, name: "em-dash", hint: "use a comma, colon, or parentheses" },
];

let failures = 0;
const fail = (where, text, rule) => {
  const at = text.indexOf(rule.char);
  const around = text.slice(Math.max(0, at - 40), at + 40);
  console.error(`  FAIL  ${where}\n        ${rule.name}: …${around}…\n        ${rule.hint}`);
  failures++;
};

// --- data files: walk every string value on every entry ---
const DATASETS = [
  ["projects", projects],
  ["roles", roles],
  ["education", education],
  ["classes", classes],
];

let scanned = 0;
for (const [label, list] of DATASETS) {
  for (const item of list) {
    const walk = (value, path) => {
      if (typeof value === "string") {
        scanned++;
        for (const rule of BANNED) if (value.includes(rule.char)) fail(`${label}/${item.slug} ${path}`, value, rule);
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    for (const [k, v] of Object.entries(item)) walk(v, k);
  }
}

// --- source files: JSX/HTML text, minus comments ---
// Covers pages AND components AND index.html. The first pass at this only
// scanned src/pages, and so missed three strings a reader actually meets:
// the browser-tab <title>, the logo's aria-label, and the animation
// iframe's accessible name. Anything that renders or is read aloud counts
// as copy.
//
// Strips // line comments, /* */ blocks, {/* */} JSX comments, and HTML
// comments so an annotated source does not trip the check.
const SOURCES = [
  ...[
    "About", "Classes", "Contact", "Education", "Experience", "ExperienceDetail",
    "Home", "NotFound", "ProjectDetail", "Projects", "ProjectsCompleted",
    "ProjectsInProgress", "ProjectsPlanned", "Resume", "WorkExcerpts",
  ].map((n) => `src/pages/${n}.jsx`),
  ...[
    "Header", "Footer", "Layout", "Divider", "MapMenu", "ModelViewer",
    "LazyModelViewer", "Reveal",
  ].map((n) => `src/components/${n}.jsx`),
  "index.html",
];

let filesScanned = 0;
for (const path of SOURCES) {
  let src;
  try {
    src = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  filesScanned++;
  const stripped = src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  stripped.split("\n").forEach((line, i) => {
    for (const rule of BANNED) {
      if (line.includes(rule.char)) fail(`${path}:${i + 1}`, line.trim(), rule);
    }
  });
}

console.log(
  failures
    ? `\n${failures} copy issue(s).`
    : `No banned characters in ${scanned} data strings or ${filesScanned} source files.`,
);
process.exit(failures ? 1 : 0);
