// Reports imported identifiers that are never used in the file body
// (these become TS6133 "declared but never read" when noUnusedLocals is on).
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = process.argv.slice(2).map((f) => path.resolve(root, f));

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const importRe = /import\s+(?:type\s+)?(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\})?\s*from\s*["'][^"']+["'];/g;
  const names = [];
  let m;
  while ((m = importRe.exec(text))) {
    if (m[1]) names.push(m[1]);
    if (m[2]) {
      for (const part of m[2].split(",")) {
        const t = part.trim().replace(/^type\s+/, "");
        if (!t) continue;
        const alias = t.includes(" as ") ? t.split(" as ")[1].trim() : t;
        names.push(alias);
      }
    }
  }
  // body = everything after the last import statement
  const lastImport = text.lastIndexOf("import ");
  const body = text.slice(lastImport);
  console.log(`\n### ${path.relative(root, f)}  (${names.length} imported names)`);
  for (const n of names) {
    const uses = (body.match(new RegExp(`\\b${n.replace(/\$/g, "\\$")}\\b`, "g")) || []).length;
    if (uses === 0) console.log(`   UNUSED: ${n}`);
  }
}
