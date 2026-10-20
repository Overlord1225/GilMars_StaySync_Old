const fs = require("fs");
const file = process.argv[2] || "src/pages/UnitDetails.tsx";
const s = fs.readFileSync(file, "utf8");
const lines = s.split(/\r\n|\n|\r/);
console.log("total lines:", lines.length);

let depth = 0;
const stack = [];
lines.forEach((l, i) => {
  const opens = (l.match(/<div\b/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  if (opens || closes) {
    depth += opens - closes;
    console.log(`${i + 1} depth=${depth} +${opens} -${closes} | ${l.trim().slice(0, 70)}`);
  }
});
console.log("final depth:", depth);

// report non-ascii
[...s].forEach((c, i) => {
  if (c.charCodeAt(0) > 126) {
    console.log("non-ascii char", JSON.stringify(c), "at", i, "line", s.slice(0, i).split("\n").length);
  }
});
