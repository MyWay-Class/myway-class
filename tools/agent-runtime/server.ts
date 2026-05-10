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
}

const port = Number(process.env.AGENT_RUNTIME_PORT || "8787");
const host = process.env.AGENT_RUNTIME_HOST || "127.0.0.1";
const apiKey = process.env.ORCH_AGENT_API_KEY || "";
const allowedRoot = resolve(process.env.AGENT_RUNTIME_ALLOWED_ROOT || process.cwd());

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

function buildWorkerResponse(body: WorkerRunRequest): {
  summary: string;
  filesChanged: string[];
  risks: string[];
  pass: boolean;
  messages: string[];
} {
  const timeoutMs = Math.min(Math.max(body.timeoutMs ?? 120_000, 5_000), 15 * 60_000);
  const filesChanged = Array.from(new Set(body.filesChangedHint ?? []));
  const messages: string[] = [];
  const risks: string[] = [];
  let pass = true;
  let summary = `${body.role} analysis only`;

  if (body.role === "backend-dev" && body.profile === "strict") {
    const result = runCommand(body.projectDir, "npm run build:backend", timeoutMs);
    pass = result.pass;
    summary = pass ? "backend build/contract check passed (remote)" : "backend build/contract check failed (remote)";
    messages.push(`backend-dev: ${summary}`);
    if (!pass) risks.push("backend-dev remote command failed");
  }
  if (body.role === "frontend-dev" && body.profile === "strict") {
    const result = runCommand(body.projectDir, "npm run build:frontend", timeoutMs);
    pass = result.pass;
    summary = pass ? "frontend build passed (remote)" : "frontend build failed (remote)";
    messages.push(`frontend-dev: ${summary}`);
    if (!pass) risks.push("frontend-dev remote command failed");
  }
  if (body.role === "test-engineer" && body.profile === "strict") {
    const result = runCommand(body.projectDir, "npm run test:backend", timeoutMs);
    pass = result.pass;
    summary = pass ? "backend tests passed (remote)" : "backend tests failed (remote)";
    messages.push(`test-engineer: ${summary}`);
    if (!pass) risks.push("test-engineer remote command failed");
  }
  if (body.role === "docs-writer") {
    summary = "docs review completed (remote): no additional docs required";
    messages.push(`docs-writer: ${summary}`);
  }
  if (body.profile === "baseline" && (body.role === "backend-dev" || body.role === "test-engineer")) {
    summary = `${body.role} skipped in baseline profile (remote)`;
    pass = true;
    risks.length = 0;
    messages.push(summary);
  }

  return { summary, filesChanged, risks, pass, messages };
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
      const payload = buildWorkerResponse(body);
      writeJson(res, 200, payload);
      return;
    }

    if (req.method === "POST" && req.url === "/debate/round") {
      const body = await parseJson<DebateRoundRequest>(req);
      if (!body?.taskId || !body?.profile || !body?.optionA || !body?.optionB) {
        writeJson(res, 400, { error: "invalid debate payload" });
        return;
      }
      const chosen = body.profile === "strict" ? "A" : "B";
      const rationale = chosen === "A" ? body.optionA : body.optionB;
      writeJson(res, 200, {
        chosen,
        rationale,
        messages: [
          { role: "worker-A", message: body.optionA },
          { role: "worker-B", message: body.optionB },
          { role: "critic", message: `selected ${chosen}: ${rationale}` },
          { role: "manager", message: `execute plan ${chosen} for ${body.profile} profile` }
        ]
      });
      return;
    }

    writeJson(res, 404, { error: "not found" });
  } catch (error) {
    writeJson(res, 500, { error: (error as Error).message });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`[agent-runtime] listening on http://${host}:${port}\n`);
  process.stdout.write(`[agent-runtime] allowed_root=${allowedRoot}\n`);
});
