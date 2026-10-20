// Validates every Tailwind class used in the given files against the real
// Tailwind v4 compiler output for this project. Reports classes that produce
// no CSS rule (i.e. classes the Tailwind IntelliSense extension flags).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.cwd();
const files = process.argv.slice(2).map((f) => path.resolve(root, f));

const { compile } = require("tailwindcss");
const css = fs.readFileSync(path.join(root, "src/index.css"), "utf8");

const compiler = await compile(css, {
  base: path.join(root, "src"),
  loadStylesheet: async (id, base) => {
    // resolve bare "tailwindcss" / "tailwindcss/preflight" etc.
    const resolved = id.startsWith(".") || id.startsWith("/")
      ? path.resolve(base, id)
      : require.resolve(id, { paths: [root] });
    const file = resolved.endsWith(".css") ? resolved : resolved + ".css";
    return { base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
  },
  loadModule: async () => { throw new Error("no modules"); },
});

const sources = new Map(files.map((f) => [f, fs.readFileSync(f, "utf8")]));
const built = await compiler.build(Object.fromEntries(sources));

const generated = new Set();
for (const cssText of built.children) {
  for (const m of cssText.matchAll(/\.((?:[^\s.,:>+~()[\]{}"'\\]|\\.)+)/g)) {
    generated.add(m[1]);
  }
}

function extractCandidates(text) {
  const found = new Set();
  const attrRe = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
  let m;
  while ((m = attrRe.exec(text))) {
    const raw = m[1] || m[2] || m[3] || m[4] || "";
    for (const token of raw.split(/\s+/)) {
      const t = token.trim();
      if (!t) continue;
      if (t.includes("${")) continue;
      found.add(t);
    }
  }
  const helperRe = /\b(?:cn|clsx|twMerge|classNames)\s*\(([\s\S]{0,2000}?)\)/g;
  while ((m = helperRe.exec(text))) {
    for (const token of m[1].split(/[\s"'`,]+/)) {
      const t = token.trim();
      if (!t || t.includes("${")) continue;
      if (!/^[a-z0-9:\/\[\]\-\.%_]+$/i.test(t)) continue;
      found.add(t);
    }
  }
  return found;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let total = 0;
for (const f of files) {
  const cands = extractCandidates(sources.get(f));
  const invalid = [];
  for (const c of cands) {
    if (!generated.has(escape(c))) invalid.push(c);
  }
  total += invalid.length;
  console.log(`\n### ${path.relative(root, f)}  (${cands.size} candidates, ${invalid.length} unmatched)`);
  for (const c of invalid) console.log(`   UNMATCHED: ${c}`);
}
console.log(`\nTOTAL UNMATCHED: ${total}`);
