// Export a CSV of REAL people missing a birthdate, for John to send to
// relatives to fill in. Reads js/data.js the same trusted-first-party way the
// validator does; writes exports/birthdays-to-fill.csv. Read-only on data.js.
//
//   node scripts/export-missing-birthdays.mjs
//
// Columns: id, first name, last name, birthday (birthday intentionally blank —
// that's what relatives fill). Rows grouped by branch (last name, then first
// name) so the single file can be split per relative later.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(here, "..", "js", "data.js");
const outPath = path.join(here, "..", "exports", "birthdays-to-fill.csv");

// data.js is a trusted, committed first-party file that already runs as the
// app's data module — same trust boundary as the app itself. Do NOT point this
// at untrusted input.
const win = {};
new Function("window", readFileSync(dataPath, "utf8"))(win);
const people = win.FAMILY_DATA;

// Missing birthday = null / undefined / empty-after-trim. Exclude placeholders.
const missing = people.filter((p) => {
  const d = p.data || {};
  if (d.placeholder === true) return false;
  const b = d.birthdate;
  return b == null || String(b).trim() === "";
});

// Group by branch (last name), then first name. Locale-insensitive, stable,
// case-insensitive so "de"/"De" don't split; empty surnames sort last.
const key = (s) => (s || "").trim().toLowerCase();
missing.sort((a, b) => {
  const al = key(a.data["last name"]);
  const bl = key(b.data["last name"]);
  if (!al !== !bl) return al ? -1 : 1; // non-empty surnames before empty
  if (al !== bl) return al < bl ? -1 : 1;
  const af = key(a.data["first name"]);
  const bf = key(b.data["first name"]);
  if (af !== bf) return af < bf ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
});

// RFC-4180 quoting: quote if the field has comma, quote, CR or LF; double
// embedded quotes. Quote defensively even when not strictly required is fine,
// but we only quote when needed to keep the file clean.
const csv = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const header = ["id", "first name", "last name", "birthday"];
const lines = [header.map(csv).join(",")];
for (const p of missing) {
  lines.push(
    [p.id, p.data["first name"], p.data["last name"], ""].map(csv).join(",")
  );
}
// CRLF line endings — friendliest for Excel/Sheets on Windows.
const out = lines.join("\r\n") + "\r\n";

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, out, "utf8");

console.log(`Wrote ${missing.length} rows to ${outPath}`);
console.log(`(${people.length} people total; ${people.length - missing.length} excluded — already-dated or placeholder.)`);
