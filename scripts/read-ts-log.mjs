// Reads the VS Code TypeScript language-features log and prints lines that
// mention the files of interest or any diagnostics.
import fs from "node:fs";

const logPath = (process.env.TS_LOG || process.argv[2] || "").trim();
const needles = process.argv.slice(process.env.TS_LOG ? 2 : 3).map((n) => n.toLowerCase());

const text = fs.readFileSync(logPath, "utf8");
const lines = text.split(/\r?\n/);
console.log(`--- ${logPath}: ${lines.length} lines ---`);

for (const line of lines) {
  const low = line.toLowerCase();
  if (needles.length === 0 || needles.some((n) => low.includes(n))) {
    console.log(line.slice(0, 500));
  }
}
