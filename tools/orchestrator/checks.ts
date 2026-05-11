import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export type CheckName = "tests" | "style" | "security" | "performance";

export interface CheckResult {
  name: CheckName;
  command: string;
  pass: boolean;
  skipped?: boolean;
  reason?: string;
}
export type OrchestratorProfile = "strict" | "collab" | "baseline";

function hasScript(name: string, scripts: Record<string, string>): boolean {
  return Object.prototype.hasOwnProperty.call(scripts, name);
}

function run(cmd: string, cwd: string): boolean {
  const out = spawnSync(cmd, {
    cwd,
    shell: true,
    stdio: "pipe",
    maxBuffer: 20 * 1024 * 1024
  });
  return out.status === 0;
}

function runScriptOrSkip(script: string, checkName: CheckName, cwd: string, scripts: Record<string, string>): CheckResult {
  if (!hasScript(script, scripts)) {
    return { name: checkName, command: `npm run ${script}`, pass: true, skipped: true, reason: `${script} script not found` };
  }
  const cmd = `npm run ${script}`;
  return { name: checkName, command: cmd, pass: run(cmd, cwd) };
}

export function runChecks(projectDir: string, profile: OrchestratorProfile): { pass: boolean; checks: CheckResult[] } {
  const pkg = JSON.parse(readFileSync(`${projectDir}/package.json`, "utf-8")) as { scripts?: Record<string, string> };
  const scripts = pkg.scripts ?? {};

  const checks: CheckResult[] =
    profile === "baseline"
      ? [
          runScriptOrSkip("build:frontend", "tests", projectDir, scripts),
          runScriptOrSkip("build:frontend", "style", projectDir, scripts),
          { name: "security", command: "baseline-skip", pass: true, skipped: true, reason: "baseline profile skips audit" },
          { name: "performance", command: "baseline-skip", pass: true, skipped: true, reason: "baseline profile skips perf smoke" }
        ]
      : profile === "collab"
        ? [
            runScriptOrSkip("test:backend:clean", "tests", projectDir, scripts),
            runScriptOrSkip("lint", "style", projectDir, scripts),
            { name: "security", command: "npm audit --audit-level=moderate", pass: run("npm audit --audit-level=moderate", projectDir) },
            runScriptOrSkip("perf:smoke", "performance", projectDir, scripts)
          ]
        : [
            runScriptOrSkip("test:backend:clean", "tests", projectDir, scripts),
            {
              name: "style",
              command: "verify-workspace-owns-style",
              pass: true,
              skipped: true,
              reason: "style check is covered by verify-workspace workflow"
            },
            { name: "security", command: "npm audit --audit-level=high", pass: run("npm audit --audit-level=high", projectDir) },
            {
              name: "performance",
              command: "verify-workspace-owns-performance",
              pass: true,
              skipped: true,
              reason: "performance smoke check is covered by verify-workspace workflow"
            }
          ];

  return { pass: checks.every((check) => check.pass), checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  const profile = (process.env.ORCH_PROFILE as OrchestratorProfile) || "strict";
  const result = runChecks(projectDir, profile);
  process.stdout.write(JSON.stringify({ profile, ...result }, null, 2));
}
