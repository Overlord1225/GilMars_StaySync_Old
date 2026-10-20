// Ground-truth probe: drives the real tsserver the way VS Code does.
// Uses semanticDiagnosticsSync (a request/response command) and a positive
// control file so we can trust a "0 diagnostics" result.
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const root = process.cwd();
const tsServer = path.join(root, "node_modules", "typescript", "lib", "tsserver.js");
const files = process.argv.slice(2).map((f) => path.resolve(root, f));

// --- positive control ---
const control = path.join(root, "src", "__probe_control.tsx");
fs.writeFileSync(control, 'const x: number = "not a number";\nexport default x;\n', "utf8");
files.push(control);

const proc = spawn(process.execPath, [tsServer], { cwd: root });
let buf = Buffer.alloc(0);
const pending = new Map();
let seq = 0;

function write(command, args) {
  const msg = JSON.stringify({ seq: ++seq, type: "request", command, arguments: args });
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(msg, "utf8")}\r\n\r\n${msg}`, "utf8");
}

function request(command, args, ms = 45000) {
  const mySeq = seq + 1;
  write(command, args);
  return new Promise((resolve) => {
    const timer = setTimeout(() => { pending.delete(mySeq); resolve({ timeout: true }); }, ms);
    pending.set(mySeq, (m) => { clearTimeout(timer); resolve(m); });
  });
}

proc.stdout.on("data", (d) => {
  buf = Buffer.concat([buf, d]);
  for (;;) {
    const idx = buf.indexOf("\r\n\r\n");
    if (idx === -1) return;
    const header = buf.slice(0, idx).toString("utf8");
    const lenMatch = /Content-Length:\s*(\d+)/i.exec(header);
    if (!lenMatch) { buf = buf.slice(idx + 4); continue; }
    const len = parseInt(lenMatch[1], 10);
    if (buf.length < idx + 4 + len) return;
    const body = buf.slice(idx + 4, idx + 4 + len).toString("utf8");
    buf = buf.slice(idx + 4 + len);
    let msg;
    try { msg = JSON.parse(body); } catch { continue; }
    if (msg.type === "response" && pending.has(msg.request_seq)) {
      pending.get(msg.request_seq)(msg);
      pending.delete(msg.request_seq);
    }
  }
});

(async () => {
  write("configure", { hostInfo: "vscode" });
  for (const name of ["tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]) {
    const p = path.join(root, name);
    if (fs.existsSync(p)) write("open", { file: p, projectRootPath: root, fileContent: fs.readFileSync(p, "utf8") });
  }
  for (const f of files) write("open", { file: f, projectRootPath: root, fileContent: fs.readFileSync(f, "utf8") });
  await new Promise((r) => setTimeout(r, 3000));

  let total = 0;
  for (const f of files) {
    const info = await request("projectInfo", { file: f, needFileNameList: false });
    const cfg = info.body ? (info.body.configFileName || "INFERRED (no tsconfig)") : "<timeout>";
    const res = await request("semanticDiagnosticsSync", { file: f });
    const diags = (res.body && res.body.diagnostics) || [];
    total += diags.length;
    console.log(`\n### ${path.relative(root, f)}  [project: ${cfg}]  -> ${diags.length} diagnostic(s)`);
    for (const d of diags.slice(0, 10)) {
      const line = d.start ? d.start.line + 1 : "?";
      console.log(`   [${d.code}] ${line}: ${d.text}`);
    }
    if (diags.length > 10) console.log(`   ... ${diags.length - 10} more`);
  }
  console.log(`\nTOTAL (incl. control): ${total}`);
  try { fs.unlinkSync(control); } catch {}
  proc.kill();
  process.exit(0);
})();
