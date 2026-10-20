// Greps a VS Code extension bundle for diagnostic message strings.
import fs from "node:fs";
import path from "node:path";

const dir = (process.env.EXT_DIR || "").trim();
const needles = process.argv.slice(2).map((n) => n.toLowerCase());

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|json|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(dir);
console.log(`scanning ${files.length} files in ${dir}`);

for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
  const lower = text.toLowerCase();
  for (const needle of needles) {
    let idx = lower.indexOf(needle);
    let count = 0;
    while (idx !== -1 && count < 3) {
      const start = Math.max(0, idx - 120);
      console.log(`\n[${path.relative(dir, f)}] ...${text.slice(start, idx + 200).replace(/\s+/g, " ")}...`);
      idx = lower.indexOf(needle, idx + 1);
      count++;
    }
  }
}
