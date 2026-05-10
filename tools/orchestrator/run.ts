import { appendFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import YAML from "yaml";
import { runChecks, type OrchestratorProfile } from "./checks";
import { validateOrThrow } from "./validate";
import { buildScorecard, loadRules } from "./score";

type WorkerRole = "backend-dev" | "frontend-dev" | "test-engineer" | "docs-writer";

interface WorkerReport {
  taskId: string;
  role: WorkerRole;
  summary: string;
  filesChanged: string[];
  risks: string[];
  executionPlan: {
    steps: string[];
    commands: string[];
    riskLevel: "low" | "medium" | "high";
  };
  timestamp: string;
}

interface Policy {
  retry?: { worker_max_retries?: number; check_max_retries?: number };
  timeouts?: { worker_timeout_minutes?: number; review_timeout_minutes?: number };
  fallback?: { on_repeated_failure?: string; allow_partial_report?: boolean };
  debate?: { max_rounds?: number };
  agent_runtime?: {
    mode?: "local" | "remote";
    endpoint?: string;
    timeout_seconds?: number;
    api_key_env?: string;
  };
}

const taskId = process.env.TASK_ID || `task-${Date.now()}`;
const traceId = process.env.TRACE_ID || `${taskId}-${Math.random().toString(36).slice(2, 10)}`;
const projectDir = process.env.PROJECT_DIR || process.cwd();
const profile = (process.env.ORCH_PROFILE as OrchestratorProfile) || "strict";
const workspaceDir = join(projectDir, "_workspace");
const logsDir = join(workspaceDir, "logs");
const threadsDir = join(workspaceDir, "threads");
const reportsDir = join(workspaceDir, "reports");

for (const dir of [workspaceDir, logsDir, threadsDir, reportsDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const policy = YAML.parse(readFileSync(join(projectDir, "ops/workflow/policy.yaml"), "utf-8")) as Policy;
const workerMaxRetries = policy.retry?.worker_max_retries ?? 1;
const checkMaxRetries = policy.retry?.check_max_retries ?? 1;
const workerTimeoutMs = (policy.timeouts?.worker_timeout_minutes ?? 15) * 60 * 1000;
const agentMode = (process.env.ORCH_AGENT_MODE as "local" | "remote") || policy.agent_runtime?.mode || "local";
const agentEndpoint = process.env.ORCH_AGENT_ENDPOINT || policy.agent_runtime?.endpoint || "";
const agentTimeoutMs = (policy.agent_runtime?.timeout_seconds ?? 60) * 1000;
const agentApiKeyEnv = policy.agent_runtime?.api_key_env || "ORCH_AGENT_API_KEY";

function stateLog(from: string | null, to: string, actor: string): void {
  appendFileSync(join(logsDir, "state-transitions.jsonl"), JSON.stringify({ taskId, traceId, from, to, actor, at: new Date().toISOString() }) + "\n");
}

function auditLog(event: Record<string, unknown>): void {
  appendFileSync(join(logsDir, "audit-events.jsonl"), JSON.stringify({ taskId, traceId, at: new Date().toISOString(), ...event }) + "\n");
}

function runCmd(cmd: string, timeoutMs: number): boolean {
  const out = spawnSync(cmd, {
    cwd: projectDir,
    shell: true,
    stdio: "pipe",
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024
  });
  return out.status === 0;
}

function runCmdOut(cmd: string, timeoutMs: number): string {
  const out = spawnSync(cmd, {
    cwd: projectDir,
    shell: true,
    stdio: "pipe",
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024
  });
  return (out.stdout || "").toString("utf-8").trim();
}

function runWithRetry(action: () => boolean, retries: number): boolean {
  for (let i = 0; i <= retries; i += 1) {
    if (action()) return true;
  }
  return false;
}

function getGitChangedFiles(): string[] {
  const tracked = runCmdOut("git diff --name-only", 10_000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const staged = runCmdOut("git diff --cached --name-only", 10_000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const untracked = runCmdOut("git ls-files --others --exclude-standard", 10_000)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return Array.from(new Set([...tracked, ...staged, ...untracked]));
}

function roleOwnsFile(role: WorkerRole, filePath: string): boolean {
  if (role === "backend-dev") return filePath.startsWith("backend-spring/") || filePath.startsWith("backend/");
  if (role === "frontend-dev") return filePath.startsWith("frontend/") || filePath.startsWith("myway-class-ui");
  if (role === "test-engineer") return /test|spec|contract/i.test(filePath);
  if (role === "docs-writer") return filePath.startsWith("docs/") || filePath.endsWith(".md");
  return false;
}

function localWorkerReport(role: WorkerRole): WorkerReport {
  let pass = true;
  let summary = "no-op";
  const baselineSkips = profile === "baseline" && (role === "backend-dev" || role === "test-engineer");
  const testOwnedByChecks = role === "test-engineer";
  const frontendOwnedByVerifyWorkflow = role === "frontend-dev";

  if (baselineSkips) {
    summary = `${role} skipped in baseline profile`;
  }
  if (!baselineSkips && testOwnedByChecks) {
    summary = `${role} skipped: strict test execution is owned by checks.ts`;
  }
  if (!baselineSkips && frontendOwnedByVerifyWorkflow) {
    summary = `${role} skipped: frontend build is covered by verify-workspace workflow`;
  }

  if (!baselineSkips && role === "backend-dev") {
    pass = runWithRetry(() => runCmd("npm run build:backend", workerTimeoutMs), workerMaxRetries);
    summary = pass ? "backend build/contract check passed" : "backend build/contract check failed";
  }
  if (!baselineSkips && !frontendOwnedByVerifyWorkflow && role === "frontend-dev") {
    pass = runWithRetry(() => runCmd("npm run build:frontend", workerTimeoutMs), workerMaxRetries);
    summary = pass ? "frontend build passed" : "frontend build failed";
  }
  if (!baselineSkips && !testOwnedByChecks && role === "test-engineer") {
    pass = runWithRetry(() => runCmd("npm run test:backend", workerTimeoutMs), workerMaxRetries);
    summary = pass ? "backend tests passed" : "backend tests failed";
  }
  if (role === "docs-writer") {
    summary = "docs worker placeholder: no docs change requested";
  }

  const changedFiles = getGitChangedFiles().filter((filePath) => roleOwnsFile(role, filePath));
  const report: WorkerReport = {
    taskId,
    role,
    summary,
    filesChanged: changedFiles,
    risks: pass ? [] : [`${role} command failed`],
    executionPlan: planForRole(role, summary, !pass),
    timestamp: new Date().toISOString()
  };

  validateOrThrow(join(projectDir, "ops/workflow/contracts/worker_report.json"), report, `${role} report`);
  writeFileSync(join(reportsDir, `${taskId}-${role}.json`), JSON.stringify(report, null, 2));
  appendFileSync(join(threadsDir, `${taskId}.jsonl`), JSON.stringify({ role, message: summary, at: new Date().toISOString() }) + "\n");
  return report;
}

interface RemoteWorkerResponse {
  summary?: string;
  filesChanged?: string[];
  risks?: string[];
  pass?: boolean;
  messages?: string[];
  executionPlan?: {
    steps?: string[];
    commands?: string[];
    riskLevel?: "low" | "medium" | "high";
  };
}

type RequestChangeCode =
  | "WORKER_BACKEND_FAILED"
  | "WORKER_FRONTEND_FAILED"
  | "WORKER_TEST_FAILED"
  | "WORKER_DOCS_FAILED"
  | "CHECK_TESTS_FAILED"
  | "CHECK_STYLE_FAILED"
  | "CHECK_SECURITY_FAILED"
  | "CHECK_PERFORMANCE_FAILED"
  | "CHECK_UNKNOWN_FAILED"
  | "REMOTE_RUNTIME_UNAVAILABLE";

function planForRole(role: WorkerRole, summary: string, isFail: boolean): WorkerReport["executionPlan"] {
  if (role === "backend-dev") {
    return {
      steps: ["compile backend modules", "run contract-sensitive packaging"],
      commands: ["npm run build:backend"],
      riskLevel: isFail ? "high" : "medium"
    };
  }
  if (role === "frontend-dev") {
    return {
      steps: ["compile frontend bundle", "validate build output"],
      commands: ["npm run build:frontend"],
      riskLevel: isFail ? "medium" : "low"
    };
  }
  if (role === "test-engineer") {
    return {
      steps: ["run backend tests", "collect failures for remediation"],
      commands: ["npm run test:backend"],
      riskLevel: isFail ? "high" : "medium"
    };
  }
  return {
    steps: ["inspect docs impact", "record documentation actions"],
    commands: ["echo docs-worker-noop"],
    riskLevel: summary.includes("no docs") ? "low" : "medium"
  };
}

function requestChangeCodesFromFailures(
  failedWorkers: Array<{ role: WorkerRole; risks: string[] }>,
  failedChecks: string[],
  finalReports: WorkerReport[]
): RequestChangeCode[] {
  const codes = new Set<RequestChangeCode>();
  for (const worker of failedWorkers) {
    if (worker.role === "backend-dev") codes.add("WORKER_BACKEND_FAILED");
    if (worker.role === "frontend-dev") codes.add("WORKER_FRONTEND_FAILED");
    if (worker.role === "test-engineer") codes.add("WORKER_TEST_FAILED");
    if (worker.role === "docs-writer") codes.add("WORKER_DOCS_FAILED");
  }
  for (const checkName of failedChecks) {
    if (checkName.toLowerCase().includes("test")) codes.add("CHECK_TESTS_FAILED");
    else if (checkName.toLowerCase().includes("lint") || checkName.toLowerCase().includes("style")) codes.add("CHECK_STYLE_FAILED");
    else if (checkName.toLowerCase().includes("security") || checkName.toLowerCase().includes("audit")) codes.add("CHECK_SECURITY_FAILED");
    else if (checkName.toLowerCase().includes("perf")) codes.add("CHECK_PERFORMANCE_FAILED");
    else codes.add("CHECK_UNKNOWN_FAILED");
  }
  if (finalReports.some((report) => report.risks.some((risk) => risk.includes("remote worker unavailable")))) {
    codes.add("REMOTE_RUNTIME_UNAVAILABLE");
  }
  return [...codes];
}

async function callRemoteWorker(role: WorkerRole): Promise<WorkerReport> {
  if (!agentEndpoint) {
    throw new Error("ORCH_AGENT_MODE=remote requires ORCH_AGENT_ENDPOINT or policy.agent_runtime.endpoint");
  }
  const ownedChangedFiles = getGitChangedFiles().filter((filePath) => roleOwnsFile(role, filePath));
  const apiKey = process.env[agentApiKeyEnv];
  const response = await fetch(`${agentEndpoint.replace(/\/$/, "")}/workers/run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      taskId,
      role,
      profile,
      projectDir,
      timeoutMs: workerTimeoutMs,
      filesChangedHint: ownedChangedFiles
    }),
    signal: AbortSignal.timeout(agentTimeoutMs)
  });

  if (!response.ok) {
    throw new Error(`remote worker call failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as RemoteWorkerResponse;
  const pass = payload.pass ?? (payload.risks?.length ?? 0) === 0;
  const summary = payload.summary || `${role} remote execution ${pass ? "passed" : "failed"}`;
  const fallbackPlan = planForRole(role, summary, !pass);
  const report: WorkerReport = {
    taskId,
    role,
    summary,
    filesChanged: Array.from(new Set([...(payload.filesChanged ?? []), ...ownedChangedFiles])),
    risks: payload.risks ?? (pass ? [] : [`${role} remote execution failed`]),
    executionPlan: {
      steps: payload.executionPlan?.steps ?? fallbackPlan.steps,
      commands: payload.executionPlan?.commands ?? fallbackPlan.commands,
      riskLevel: payload.executionPlan?.riskLevel ?? fallbackPlan.riskLevel
    },
    timestamp: new Date().toISOString()
  };
  for (const message of payload.messages ?? []) {
    appendFileSync(join(threadsDir, `${taskId}.jsonl`), JSON.stringify({ role, message, at: new Date().toISOString() }) + "\n");
  }
  validateOrThrow(join(projectDir, "ops/workflow/contracts/worker_report.json"), report, `${role} report`);
  writeFileSync(join(reportsDir, `${taskId}-${role}.json`), JSON.stringify(report, null, 2));
  appendFileSync(join(threadsDir, `${taskId}.jsonl`), JSON.stringify({ role, message: summary, at: new Date().toISOString() }) + "\n");
  return report;
}

async function runWorker(role: WorkerRole): Promise<WorkerReport> {
  if (agentMode === "remote") {
    try {
      return await callRemoteWorker(role);
    } catch (error) {
      const fallback = localWorkerReport(role);
      fallback.summary = `${fallback.summary} (remote fallback: ${(error as Error).message})`;
      fallback.risks = fallback.risks.length ? fallback.risks : ["remote worker unavailable, used local fallback"];
      validateOrThrow(join(projectDir, "ops/workflow/contracts/worker_report.json"), fallback, `${role} report fallback`);
      writeFileSync(join(reportsDir, `${taskId}-${role}.json`), JSON.stringify(fallback, null, 2));
      appendFileSync(
        join(threadsDir, `${taskId}.jsonl`),
        JSON.stringify({ role: "manager", message: `remote worker fallback for ${role}: ${(error as Error).message}`, at: new Date().toISOString() }) + "\n"
      );
      return fallback;
    }
  }
  return localWorkerReport(role);
}

async function debateRound(): Promise<{ chosen: "A" | "B" | "C"; rationale: string }> {
  const optionA = profile === "strict" ? "full quality gate with tests+audit" : "keep strict for production branches";
  const optionB = profile === "baseline" ? "baseline fast gate for CI" : "fallback baseline when strict repeatedly fails";
  const optionC = "merge A+B: keep strict gate with baseline fallback only for transient external failures";
  const chosen = profile === "strict" ? "A" : "B";
  const rationale = chosen === "A" ? optionA : optionB;
  if (agentMode === "remote" && agentEndpoint) {
    try {
      const apiKey = process.env[agentApiKeyEnv];
      const response = await fetch(`${agentEndpoint.replace(/\/$/, "")}/debate/round`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ taskId, profile, optionA, optionB, optionC }),
        signal: AbortSignal.timeout(agentTimeoutMs)
      });
      if (response.ok) {
        const payload = (await response.json()) as { messages?: Array<{ role: string; message: string }>; chosen?: "A" | "B" | "C"; rationale?: string };
        for (const entry of payload.messages ?? []) {
          appendFileSync(join(threadsDir, `${taskId}.jsonl`), JSON.stringify({ role: entry.role, message: entry.message, at: new Date().toISOString() }) + "\n");
        }
        return { chosen: payload.chosen || chosen, rationale: payload.rationale || rationale };
      }
    } catch {
      // fall through to local deterministic debate logging
    }
  }
  appendFileSync(
    join(threadsDir, `${taskId}.jsonl`),
    JSON.stringify({ role: "worker-A", message: optionA, at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "worker-B", message: optionB, at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "critic", message: `proposed merge option C: ${optionC}`, at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "critic", message: `selected ${chosen}: ${rationale}`, at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "manager", message: `execute plan ${chosen} for ${profile} profile`, at: new Date().toISOString() }) + "\n"
  );
  return { chosen, rationale };
}

function remediationRound(failedWorkers: string[], failedChecks: string[]): void {
  appendFileSync(
    join(threadsDir, `${taskId}.jsonl`),
    JSON.stringify({
      role: "manager",
      message: `remediation requested. failedWorkers=${failedWorkers.join(",") || "none"}, failedChecks=${failedChecks.join(",") || "none"}`,
      at: new Date().toISOString()
    }) + "\n" +
      JSON.stringify({ role: "worker-A", message: "propose targeted rerun and minimal patch", at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "worker-B", message: "propose fallback path and risk containment", at: new Date().toISOString() }) + "\n" +
      JSON.stringify({ role: "critic", message: "approve one remediation round only", at: new Date().toISOString() }) + "\n"
  );
}

async function main(): Promise<void> {
  stateLog(null, "draft", "manager");
  stateLog("draft", "debate", "manager");
  const debate = await debateRound();
  auditLog({ type: "debate", chosen: debate.chosen, rationale: debate.rationale, mode: agentMode });

  const workers: WorkerRole[] = ["backend-dev", "frontend-dev", "test-engineer", "docs-writer"];
  const workerReports = await Promise.all(workers.map((role) => runWorker(role)));

  stateLog("debate", "review", "reviewer");

  let checksOutput = runChecks(projectDir, profile);
  if (!checksOutput.pass && checkMaxRetries > 0) {
    for (let i = 0; i < checkMaxRetries; i += 1) {
      checksOutput = runChecks(projectDir, profile);
      if (checksOutput.pass) break;
    }
  }
  const checksHash = createHash("sha256").update(JSON.stringify(checksOutput)).digest("hex");
  auditLog({ type: "checks", hash: checksHash, pass: checksOutput.pass });

  const rulesPath =
    profile === "baseline"
      ? join(projectDir, "ops/workflow/review-rules.baseline.yaml")
      : join(projectDir, "ops/workflow/review-rules.yaml");
  const rules = loadRules(rulesPath);
  const scorecard = buildScorecard(taskId, checksOutput.checks, rules);
  validateOrThrow(join(projectDir, "ops/workflow/contracts/review_scorecard.json"), scorecard, "review scorecard");

  let failedWorkers = workerReports
    .filter((report) => report.risks.length > 0)
    .map((report) => ({ role: report.role, risks: report.risks }));
  let failedChecks = checksOutput.checks.filter((check) => !check.pass).map((check) => check.name);

  const maxDebateRounds = Math.max(1, policy.debate?.max_rounds ?? 2);
  const shouldRetryRound = (failedWorkers.length > 0 || failedChecks.length > 0) && maxDebateRounds > 1;
  let finalWorkerReports = workerReports;
  let finalScorecard = scorecard;

  if (shouldRetryRound) {
    remediationRound(
      failedWorkers.map((worker) => worker.role),
      failedChecks
    );
    const rerunRoles = new Set(failedWorkers.map((worker) => worker.role as WorkerRole));
    const rerunReports = await Promise.all(
      finalWorkerReports.map((report) => (rerunRoles.has(report.role) ? runWorker(report.role) : Promise.resolve(report)))
    );
    finalWorkerReports = rerunReports;

    let rerunChecks = runChecks(projectDir, profile);
    if (!rerunChecks.pass && checkMaxRetries > 0) {
      for (let i = 0; i < checkMaxRetries; i += 1) {
        rerunChecks = runChecks(projectDir, profile);
        if (rerunChecks.pass) break;
      }
    }
    checksOutput = rerunChecks;
    failedWorkers = finalWorkerReports.filter((report) => report.risks.length > 0).map((report) => ({ role: report.role, risks: report.risks }));
    failedChecks = checksOutput.checks.filter((check) => !check.pass).map((check) => check.name);
    finalScorecard = buildScorecard(taskId, checksOutput.checks, rules);
    validateOrThrow(join(projectDir, "ops/workflow/contracts/review_scorecard.json"), finalScorecard, "review scorecard rerun");
    auditLog({ type: "remediation-round", rerun: 1, workerFailures: failedWorkers, checkFailures: failedChecks });
  }

  const approved = finalWorkerReports.every((report) => report.risks.length === 0) && finalScorecard.verdict === "approve";
  const finalState = approved ? "approved" : "rejected";
  stateLog("review", finalState, "manager");

  const decision = {
    taskId,
    traceId,
    state: finalState,
    decision: approved ? "approve" : "request_changes",
    reason: approved ? "workers and quality gate passed" : "worker/check/review gate failed",
    requestChangeCodes: approved ? [] : requestChangeCodesFromFailures(failedWorkers, failedChecks, finalWorkerReports),
    timestamp: new Date().toISOString(),
    nextActions: approved ? ["ready for merge gate"] : [policy.fallback?.on_repeated_failure ?? "fix failures and rerun"]
  };
  validateOrThrow(join(projectDir, "ops/workflow/contracts/manager_decision.json"), decision, "manager decision");

  writeFileSync(join(workspaceDir, "scorecard.json"), JSON.stringify(finalScorecard, null, 2));
  writeFileSync(join(workspaceDir, "decision.json"), JSON.stringify(decision, null, 2));
  auditLog({ type: "decision", decision: decision.decision, state: finalState });

  process.stdout.write(
    JSON.stringify(
      {
        taskId,
        traceId,
        profile,
        state: finalState,
        workerPass: finalWorkerReports.every((report) => report.risks.length === 0),
        checksPass: checksOutput.pass,
        checksHash,
        failedWorkers,
        failedChecks,
        agentMode
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  process.stderr.write(`orchestrator failed: ${(error as Error).message}\n`);
  process.exit(1);
});
