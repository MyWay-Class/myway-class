#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { target: "", force: false, projectName: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--target") args.target = argv[i + 1] || "";
    if (token === "--force") args.force = true;
    if (token === "--project-name") args.projectName = argv[i + 1] || "";
  }
  return args;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFileWithGuard(src, dst, force) {
  ensureDir(path.dirname(dst));
  if (fs.existsSync(dst) && !force) {
    throw new Error(`target exists (use --force): ${dst}`);
  }
  fs.copyFileSync(src, dst);
}

function copyDirRecursive(srcDir, dstDir, force) {
  ensureDir(dstDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) copyDirRecursive(src, dst, force);
    else copyFileWithGuard(src, dst, force);
  }
}

function readJsonSafe(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

function injectConfig(templatePath, targetPath, projectName, force) {
  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`target exists (use --force): ${targetPath}`);
  }
  const raw = fs.readFileSync(templatePath, "utf-8");
  const rendered = raw.replace(/__PROJECT_NAME__/g, projectName);
  fs.writeFileSync(targetPath, rendered, "utf-8");
}

function ensurePackageScripts(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  const pkg = readJsonSafe(pkgPath);
  if (!pkg) return { updated: false, reason: "package.json not found or invalid" };
  pkg.scripts = pkg.scripts || {};
  const desired = {
    "orch:run": "tsx tools/orchestrator/run.ts",
    "orch:checks": "tsx tools/orchestrator/checks.ts",
    "orch:report": "tsx tools/orchestrator/report.ts",
    "agent-runtime:start": "tsx tools/agent-runtime/server.ts"
  };
  let changed = false;
  for (const [k, v] of Object.entries(desired)) {
    if (!pkg.scripts[k]) {
      pkg.scripts[k] = v;
      changed = true;
    }
  }
  if (changed) writeJson(pkgPath, pkg);
  return { updated: changed, reason: changed ? "scripts added" : "scripts already present" };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.target) {
    process.stderr.write("usage: node tools/orchestrator/portable/install.mjs --target <absolute-path> [--project-name <name>] [--force]\n");
    process.exit(1);
  }

  const sourceRoot = process.cwd();
  const targetRoot = path.resolve(args.target);
  const projectName = args.projectName || path.basename(targetRoot);
  ensureDir(targetRoot);

  const copyPlan = [
    { src: "ops/workflow", dst: "ops/workflow", type: "dir" },
    { src: "tools/orchestrator", dst: "tools/orchestrator", type: "dir" },
    { src: "tools/agent-runtime/server.ts", dst: "tools/agent-runtime/server.ts", type: "file" },
    { src: ".github/workflows/orchestration-gate.yml", dst: ".github/workflows/orchestration-gate.yml", type: "file" }
  ];

  for (const item of copyPlan) {
    const absSrc = path.join(sourceRoot, item.src);
    const absDst = path.join(targetRoot, item.dst);
    if (!fs.existsSync(absSrc)) continue;
    if (item.type === "dir") copyDirRecursive(absSrc, absDst, args.force);
    else copyFileWithGuard(absSrc, absDst, args.force);
  }

  const templatePath = path.join(sourceRoot, "tools/orchestrator/portable/orchestration.config.template.yaml");
  const configPath = path.join(targetRoot, "orchestration.config.yaml");
  injectConfig(templatePath, configPath, projectName, args.force);
  const scriptResult = ensurePackageScripts(targetRoot);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        targetRoot,
        projectName,
        force: args.force,
        created: ["ops/workflow/*", "tools/orchestrator/*", "tools/agent-runtime/server.ts", ".github/workflows/orchestration-gate.yml", "orchestration.config.yaml"],
        packageScripts: scriptResult
      },
      null,
      2
    ) + "\n"
  );
}

main();
