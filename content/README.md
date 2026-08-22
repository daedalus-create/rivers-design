# Content spreadsheets

Everything the site says about a project, role, school, or class lives in
these four files. Edit them in Excel, Numbers, or Google Sheets, then run:

```bash
npm run import-content
```

That regenerates `src/data/*.js`, which is what the site actually reads.
Those generated files are not meant to be hand-edited; the next import
would overwrite the change.

| Spreadsheet      | Becomes               | Shows up on            |
| ---------------- | --------------------- | ---------------------- |
| `projects.csv`   | `src/data/projects.js`  | `/projects` and its three lists |
| `experience.csv` | `src/data/roles.js`     | `/experience/work-excerpts` |
| `education.csv`  | `src/data/education.js` | `/experience/education` |
| `classes.csv`    | `src/data/classes.js`   | `/experience/classes` |

## Adding something

Add a row. That is the whole process for a project, a role, a school, or
a class — the page, the route, and the listing all follow from it.

Two things are worth knowing:

**There is no number column.** Display numbers come from row order, and
for projects from row order within a status. Delete a row from the middle
and everything after it renumbers itself.

**Add it to the menu separately.** A new page still needs an entry in
`src/data/siteTree.js` to appear in the site menu, or it exists but
cannot be reached. That file is the nav graph and is edited by hand.

## Columns

Every sheet has the same columns, so the format only has to be learned
once. A section leaves the ones it does not use empty — classes fill in
four of them and nothing else.

| Column | Meaning |
| --- | --- |
| `slug` | URL segment and internal id. Lowercase, hyphens, no spaces. Must be unique within the sheet. Changing it changes the page's URL. |
| `title` | Display name. |
| `sub` | The one-line description under the title. |
| `status` | **Projects only.** `completed`, `in-progress`, or `planned`. Decides which list the entry appears in. |
| `model` | Which 3D placeholder to show. Must name a builder in `src/components/modelBuilders.js`. Leave blank for none. |
| `desc` | A short paragraph, shown on listing cards. |
| `body1`–`body4` | Paragraphs for the entry's own page. Fill from 1; blanks are skipped. |
| `spec1_key` / `spec1_value` … up to 6 | The key/value rows under an entry. Keys are short labels, roughly 12 characters before they wrap. |
| `highlight1_key` / `highlight1_value` … up to 6 | A second key/value list, currently used for highlighted classes on education entries. |

## What the import checks

It refuses to write anything if a sheet has a problem, and names the row:

- a missing or duplicate `slug`, or a missing `title`
- a `status` that is not one of the three, or a status on a sheet that
  does not use them
- a `model` with no matching builder, which would otherwise silently fall
  back to the generic placeholder
- a spec or highlight with a key but no value, or the reverse, which
  would render as a blank row

## Editing notes

Keep the file as CSV, not XLSX. It is what the importer reads, and it is
also what lets git show exactly which cell changed in a commit.

Watch out for em-dashes. Word processors and spreadsheets like to insert
them automatically, and `npm run check-copy` will fail the build over
one. Use a comma, a colon, or parentheses.
