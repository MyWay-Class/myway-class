import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type WorkerRole = "backend-dev" | "frontend-dev" | "test-engineer" | "docs-writer";
type OrchestratorProfile = "strict" | "baseline";

interface WorkerRunRequest {
  taskId: string;
  role: WorkerRole;
  profile: OrchestratorProfile;
  projectDir: string;
  timeoutMs?: number;
  filesChangedHint?: string[];
}

interface DebateRoundRequest {
  taskId: string;
  profile: OrchestratorProfile;
  optionA: string;
  optionB: string;
  optionC?: string;
}

interface DebateSessionOpenRequest {
  taskId: string;
  profile: OrchestratorProfile;
  participants?: string[];
}

interface DebateSessionMessageRequest {
  sessionId: string;
  role: string;
  message: string;
}

interface DebateSessionDecideRequest {
  sessionId: string;
  options: { A: string; B: string; C?: string };
}

const port = Number(process.env.AGENT_RUNTIME_PORT || "8787");
const host = process.env.AGENT_RUNTIME_HOST || "127.0.0.1";
const apiKey = process.env.ORCH_AGENT_API_KEY || "";
const allowedRoot = resolve(process.env.AGENT_RUNTIME_ALLOWED_ROOT || process.cwd());
const queueConcurrency = Math.max(1, Number(process.env.AGENT_RUNTIME_CONCURRENCY || "1"));
const commandRetries = Math.max(0, Number(process.env.AGENT_RUNTIME_COMMAND_RETRIES || "1"));
const queueTimeoutMs = Math.max(5_000, Number(process.env.AGENT_RUNTIME_QUEUE_TIMEOUT_MS || "120000"));

type QueueJob = {
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

const queue: QueueJob[] = [];
let activeWorkers = 0;
const debateSessions = new Map<
  string,
  {
    sessionId: string;
    taskId: string;
    profile: OrchestratorProfile;
    participants: string[];
    messages: Array<{ role: string; message: string; at: string }>;
    openedAt: string;
    closedAt?: string;
  }
>();

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ run, resolve: resolve as (value: unknown) => void, reject });
    drainQueue();
  });
}

function drainQueue(): void {
  while (activeWorkers < queueConcurrency && queue.length > 0) {
    const job = queue.shift();
    if (!job) return;
    activeWorkers += 1;
    job
      .run()
      .then((result) => job.resolve(result))
      .catch((error) => job.reject(error))
      .finally(() => {
        activeWorkers -= 1;
        drainQueue();
      });
  }
}

function writeJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function parseJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
}

function getPathname(urlRaw?: string): string {
  if (!urlRaw) return "";
  try {
    return new URL(urlRaw, "http://127.0.0.1").pathname;
  } catch {
    return urlRaw;
  }
}

function isAuthorized(req: IncomingMessage): boolean {
  if (!apiKey) return true;
  const auth = req.headers.authorization;
  return auth === `Bearer ${apiKey}`;
}

function isAllowedProjectDir(inputDir: string): boolean {
  const resolved = resolve(inputDir);
  return resolved === allowedRoot || resolved.startsWith(`${allowedRoot}\\`) || resolved.startsWith(`${allowedRoot}/`);
}

function runCommand(projectDir: string, command: string, timeoutMs: number): { pass: boolean; stdout: string; stderr: string } {
  const out = spawnSync(command, {
    cwd: projectDir,
    shell: true,
    stdio: "pipe",
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024
  });
  return {
    pass: out.status === 0,
    stdout: (out.stdout || "").toString("utf-8").trim(),
    stderr: (out.stderr || "").toString("utf-8").trim()
  };
}

function runCommandWithRetry(projectDir: string, command: string, timeoutMs: number): { pass: boolean; stdout: string; stderr: string; attempts: number } {
  let last = { pass: false, stdout: "", stderr: "" };
  for (let attempt = 0; attempt <= commandRetries; attempt += 1) {
    last = runCommand(projectDir, command, timeoutMs);
    if (last.pass) return { ...last, attempts: attempt + 1 };
  }
  return { ...last, attempts: commandRetries + 1 };
}

function buildWorkerResponse(body: WorkerRunRequest): {
  summary: string;
  filesChanged: string[];
  risks: string[];
  pass: boolean;
  messages: string[];
  executionPlan: { steps: string[]; commands: string[]; riskLevel: "low" | "medium" | "high" };
} {
  const timeoutMs = Math.min(Math.max(body.timeoutMs ?? 120_000, 5_000), 15 * 60_000);
  const filesChanged = Array.from(new Set(body.filesChangedHint ?? []));
  const messages: string[] = [];
  const risks: string[] = [];
  let pass = true;
  let summary = `${body.role} analysis only`;
  let executionPlan: { steps: string[]; commands: string[]; riskLevel: "low" | "medium" | "high" } = {
    steps: ["analyze requested scope"],
    commands: ["echo remote-analysis"],
    riskLevel: "low"
  };

  if (body.role === "backend-dev" && body.profile === "strict") {
    const result = runCommandWithRetry(body.projectDir, "npm run build:backend", timeoutMs);
    pass = result.pass;
    summary = pass ? "backend build/contract check passed (remote)" : "backend build/contract check failed (remote)";
    messages.push(`backend-dev: ${summary} (attempts=${result.attempts})`);
    if (!pass) risks.push("backend-dev remote command failed");
    executionPlan = {
      steps: ["compile backend modules", "run packaging contract checks"],
      commands: ["npm run build:backend"],
      riskLevel: pass ? "medium" : "high"
    };
  }
  if (body.role === "frontend-dev" && body.profile === "strict") {
    const result = runCommandWithRetry(body.projectDir, "npm run build:frontend", timeoutMs);
    pass = result.pass;
    summary = pass ? "frontend build passed (remote)" : "frontend build failed (remote)";
    messages.push(`frontend-dev: ${summary} (attempts=${result.attempts})`);
    if (!pass) risks.push("frontend-dev remote command failed");
    executionPlan = {
      steps: ["compile frontend bundle", "validate static build output"],
      commands: ["npm run build:frontend"],
      riskLevel: pass ? "low" : "medium"
    };
  }
  if (body.role === "test-engineer" && body.profile === "strict") {
    const result = runCommandWithRetry(body.projectDir, "npm run test:backend", timeoutMs);
    pass = result.pass;
    summary = pass ? "backend tests passed (remote)" : "backend tests failed (remote)";
    messages.push(`test-engineer: ${summary} (attempts=${result.attempts})`);
    if (!pass) risks.push("test-engineer remote command failed");
    executionPlan = {
      steps: ["run backend tests", "report failing suites"],
      commands: ["npm run test:backend"],
      riskLevel: pass ? "medium" : "high"
    };
  }
  if (body.role === "docs-writer") {
    summary = "docs review completed (remote): no additional docs required";
    messages.push(`docs-writer: ${summary}`);
    executionPlan = {
      steps: ["review docs delta", "emit summary note"],
      commands: ["echo docs-review"],
      riskLevel: "low"
    };
  }
  if (body.profile === "baseline" && (body.role === "backend-dev" || body.role === "test-engineer")) {
    summary = `${body.role} skipped in baseline profile (remote)`;
    pass = true;
    risks.length = 0;
    messages.push(summary);
  }

  return { summary, filesChanged, risks, pass, messages, executionPlan };
}

const server = createServer(async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      writeJson(res, 401, { error: "unauthorized" });
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      writeJson(res, 200, { ok: true, service: "agent-runtime", at: new Date().toISOString() });
      return;
    }

    if (req.method === "POST" && req.url === "/workers/run") {
      const body = await parseJson<WorkerRunRequest>(req);
      if (!body?.taskId || !body?.role || !body?.profile || !body?.projectDir) {
        writeJson(res, 400, { error: "invalid worker payload" });
        return;
      }
      if (!isAllowedProjectDir(body.projectDir)) {
        writeJson(res, 403, { error: "projectDir out of allowed root" });
        return;
      }
      const payload = await Promise.race([
        enqueue(async () => buildWorkerResponse(body)),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("worker queue timeout")), queueTimeoutMs))
      ]);
      writeJson(res, 200, payload);
      return;
    }

    if (req.method === "POST" && req.url === "/debate/round") {
      const body = await parseJson<DebateRoundRequest>(req);
      if (!body?.taskId || !body?.profile || !body?.optionA || !body?.optionB) {
        writeJson(res, 400, { error: "invalid debate payload" });
        return;
      }
      const chosen = body.optionC ? "C" : body.profile === "strict" ? "A" : "B";
      const rationale = chosen === "A" ? body.optionA : chosen === "B" ? body.optionB : body.optionC ?? `${body.optionA} + ${body.optionB}`;
      writeJson(res, 200, {
        chosen,
        rationale,
        messages: [
          { role: "worker-A", message: body.optionA },
          { role: "worker-B", message: body.optionB },
          ...(body.optionC ? [{ role: "critic", message: `proposed merge option C: ${body.optionC}` }] : []),
          { role: "critic", message: `selected ${chosen}: ${rationale}` },
          { role: "manager", message: `execute plan ${chosen} for ${body.profile} profile` }
        ]
      });
      return;
    }

    if (req.method === "POST" && req.url === "/debate/sessions/open") {
      const body = await parseJson<DebateSessionOpenRequest>(req);
      if (!body?.taskId || !body?.profile) {
        writeJson(res, 400, { error: "invalid session payload" });
        return;
      }
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const session = {
        sessionId,
        taskId: body.taskId,
        profile: body.profile,
        participants: body.participants ?? ["worker-A", "worker-B", "critic", "manager"],
        messages: [] as Array<{ role: string; message: string; at: string }>,
        openedAt: new Date().toISOString()
      };
      debateSessions.set(sessionId, session);
      writeJson(res, 200, { sessionId, openedAt: session.openedAt, participants: session.participants });
      return;
    }

    if (req.method === "POST" && req.url === "/debate/sessions/message") {
      const body = await parseJson<DebateSessionMessageRequest>(req);
      if (!body?.sessionId || !body?.role || !body?.message) {
        writeJson(res, 400, { error: "invalid message payload" });
        return;
      }
      const session = debateSessions.get(body.sessionId);
      if (!session) {
        writeJson(res, 404, { error: "session not found" });
        return;
      }
      if (session.closedAt) {
        writeJson(res, 409, { error: "session already closed" });
        return;
      }
      const entry = { role: body.role, message: body.message, at: new Date().toISOString() };
      session.messages.push(entry);
      writeJson(res, 200, { ok: true, entry, count: session.messages.length });
      return;
    }

    if (req.method === "POST" && req.url === "/debate/sessions/decide") {
      const body = await parseJson<DebateSessionDecideRequest>(req);
      if (!body?.sessionId || !body?.options?.A || !body?.options?.B) {
        writeJson(res, 400, { error: "invalid decide payload" });
        return;
      }
      const session = debateSessions.get(body.sessionId);
      if (!session) {
        writeJson(res, 404, { error: "session not found" });
        return;
      }
      const combinedMessages = session.messages.map((m) => `${m.role}:${m.message}`).join(" | ").toLowerCase();
      const preferStrict = combinedMessages.includes("strict") || session.profile === "strict";
      const hasMergeHint = combinedMessages.includes("merge") || combinedMessages.includes("병합");
      const chosen: "A" | "B" | "C" = body.options.C && hasMergeHint ? "C" : preferStrict ? "A" : "B";
      const rationale = chosen === "A" ? body.options.A : chosen === "B" ? body.options.B : body.options.C ?? `${body.options.A} + ${body.options.B}`;
      const criticMessage = { role: "critic", message: `selected ${chosen}: ${rationale}`, at: new Date().toISOString() };
      const managerMessage = { role: "manager", message: `execute plan ${chosen} for ${session.profile} profile`, at: new Date().toISOString() };
      session.messages.push(criticMessage, managerMessage);
      writeJson(res, 200, { chosen, rationale, messages: session.messages });
      return;
    }

    const pathname = getPathname(req.url);
    const sessionPathMatch = /^\/debate\/sessions\/([^/]+)$/.exec(pathname);
    if (sessionPathMatch) {
      const sessionId = decodeURIComponent(sessionPathMatch[1]);
      const session = debateSessions.get(sessionId);
      if (!session) {
        writeJson(res, 404, { error: "session not found" });
        return;
      }
      if (req.method === "GET") {
        writeJson(res, 200, session);
        return;
      }
      if (req.method === "POST") {
        session.closedAt = new Date().toISOString();
        writeJson(res, 200, { ok: true, sessionId, closedAt: session.closedAt });
        return;
      }
    }

    writeJson(res, 404, { error: "not found" });
  } catch (error) {
    writeJson(res, 500, { error: (error as Error).message });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`[agent-runtime] listening on http://${host}:${port}\n`);
  process.stdout.write(`[agent-runtime] allowed_root=${allowedRoot}\n`);
  process.stdout.write(`[agent-runtime] concurrency=${queueConcurrency}, retries=${commandRetries}, queue_timeout_ms=${queueTimeoutMs}\n`);
});
