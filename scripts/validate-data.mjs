/* ============================================================================
   validate-data.mjs  —  referential-integrity check for js/data.js
   ============================================================================

   WHY THIS EXISTS:
   The chart library builds each person's node from its rels (father, mother,
   spouses, children). If a rel points at an id that has no matching record,
   the library chokes and the affected people (and their neighbours) become
   unclickable. This kind of dangling reference is easy to introduce with a
   half-applied rename: you change a record's own id and its back-links but
   forget the FORWARD references other records hold to it.

   WHAT IT DOES:
   Loads js/data.js, collects every record id, then scans every rel reference
   (father / mother / spouses[] / children[]). Any reference whose target id
   is missing is reported as a dangling reference.

   RUN:  node scripts/validate-data.mjs
   Exit code 0 = clean, 1 = dangling references found (or duplicate ids).
   ========================================================================== */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "..", "js", "data.js");

// data.js assigns `window.FAMILY_DATA = [...]`, so give it a window to bind to.
const src = readFileSync(dataPath, "utf8");
const win = {};
new Function("window", src)(win);
const FAMILY = win.FAMILY_DATA;

if (!Array.isArray(FAMILY)) {
  console.error("FAIL: js/data.js did not produce window.FAMILY_DATA as an array.");
  process.exit(1);
}

// Build the id set, flagging any duplicate ids while we go.
const ids = new Set();
const duplicates = [];
for (const person of FAMILY) {
  if (ids.has(person.id)) duplicates.push(person.id);
  ids.add(person.id);
}

// Scan every rel reference against the id set.
const dangling = [];
const check = (fromId, field, targetId) => {
  if (targetId == null) return;
  if (!ids.has(targetId)) dangling.push({ fromId, field, targetId });
};

for (const person of FAMILY) {
  const rels = person.rels || {};
  check(person.id, "father", rels.father);
  check(person.id, "mother", rels.mother);
  for (const s of rels.spouses || []) check(person.id, "spouses", s);
  for (const c of rels.children || []) check(person.id, "children", c);
}

console.log(`Checked ${FAMILY.length} people, ${ids.size} unique ids.`);

let ok = true;

if (duplicates.length) {
  ok = false;
  console.error(`\nDUPLICATE IDS (${duplicates.length}):`);
  for (const d of duplicates) console.error(`  - ${d}`);
}

if (dangling.length) {
  ok = false;
  console.error(`\nDANGLING REFERENCES (${dangling.length}):`);
  for (const d of dangling) {
    console.error(`  - ${d.fromId}.${d.field} -> "${d.targetId}" (no such record)`);
  }
}

if (ok) {
  console.log("OK: zero dangling references, zero duplicate ids.");
  process.exit(0);
}
process.exit(1);
