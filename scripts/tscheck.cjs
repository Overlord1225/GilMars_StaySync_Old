// Uses the TypeScript Language Service API (the engine tsserver/VS Code wraps).
// `mode` selects which compilerOptions set to emulate:
//   app    -> tsconfig.app.json (what `npm run typecheck` uses)
//   root   -> tsconfig.json (solution-style, what VS Code may attach to)
//   inferred -> VS Code fallback for a file not covered by any tsconfig
//   matrix -> try many option sets and print diagnostic counts for each
const path = require("path");
const fs = require("fs");
const ts = require("typescript");

const root = process.cwd();
const mode = process.argv[2] || "app";
const files = process.argv.slice(3).map((f) => path.resolve(root, f));

function loadConfig(configPath) {
  const raw = ts.readConfigFile(configPath, ts.sys.readFile);
  if (raw.error) {
    console.error("config read error:", ts.flattenDiagnosticMessageText(raw.error.messageText, "\n"));
    return null;
  }
  return ts.parseJsonConfigFileContent(raw.config, ts.sys, path.dirname(configPath));
}

function makeService(options, fileNames) {
  const allFiles = fileNames.slice();
  for (const f of files) if (!allFiles.includes(f)) allFiles.push(f);
  const versions = new Map(allFiles.map((f) => [f, "0"]));
  const host = {
    getScriptFileNames: () => allFiles,
    getScriptVersion: (f) => versions.get(f) || "0",
    getScriptSnapshot: (f) => {
      if (!fs.existsSync(f)) return undefined;
      return ts.ScriptSnapshot.fromString(fs.readFileSync(f, "utf8"));
    },
    getCurrentDirectory: () => root,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
    useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    getNewLine: () => ts.sys.newLine,
  };
  return ts.createLanguageService(host, ts.createDocumentRegistry());
}

function countFor(service) {
  return files.map((f) => {
    const diags = [...service.getSyntacticDiagnostics(f), ...service.getSemanticDiagnostics(f)];
    return { file: f, diags };
  });
}

function print(res, label) {
  console.log(`\n### ${label}`);
  let total = 0;
  for (const r of res) {
    total += r.diags.length;
    console.log(`  ${path.relative(root, r.file)} -> ${r.diags.length}`);
    for (const d of r.diags.slice(0, 6)) {
      const { line } = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : { line: 0 };
      console.log(`     [${d.code}] ${line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
    }
    if (r.diags.length > 6) console.log(`     ... ${r.diags.length - 6} more`);
  }
  console.log(`  TOTAL: ${total}`);
  return total;
}

if (mode === "matrix") {
  const base = { strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2023 };
  const candidates = {
    "bundler + jsx:react-jsx": { ...base, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX },
    "node10 + jsx:react": { ...base, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.React, esModuleInterop: true, allowSyntheticDefaultImports: true },
    "node10 + jsx:react-jsx": { ...base, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, allowSyntheticDefaultImports: true },
    "node16 + jsx:react-jsx": { ...base, module: ts.ModuleKind.Node16, moduleResolution: ts.ModuleResolutionKind.Node16, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    "bundler + jsx:react(classic)": { ...base, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.React, esModuleInterop: true, allowSyntheticDefaultImports: true },
    "bundler + jsx:preserve": { ...base, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.Preserve, esModuleInterop: true, allowSyntheticDefaultImports: true },
    "node10 + jsx:preserve": { ...base, module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, jsx: ts.JsxEmit.Preserve, esModuleInterop: true, allowSyntheticDefaultImports: true },
  };
  for (const [name, opts] of Object.entries(candidates)) {
    print(countFor(makeService(opts, [])), name);
  }
  process.exit(0);
}

let parsed;
if (mode === "inferred") {
  parsed = { options: { jsx: ts.JsxEmit.ReactJSX, strict: true, target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, allowSyntheticDefaultImports: true, esModuleInterop: true }, fileNames: [] };
} else {
  const cfg = path.join(root, mode === "root" ? "tsconfig.json" : "tsconfig.app.json");
  parsed = loadConfig(cfg);
  if (!parsed) process.exit(1);
}

console.log(`mode=${mode}`);
console.log("files in config:", parsed.fileNames.length);

const service = makeService(parsed.options, parsed.fileNames);
const res = countFor(service);
let total = 0;
for (const r of res) {
  total += r.diags.length;
  console.log(`\n### ${path.relative(root, r.file)} -> ${r.diags.length} diagnostic(s)`);
  for (const d of r.diags) {
    const { line, character } = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
    console.log(`   [${d.code}] ${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  }
}
console.log(`\nTOTAL: ${total}`);
