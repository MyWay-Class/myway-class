import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawn } from "node:child_process";

interface SlackCommandPayload {
  command?: string;
  text?: string;
  channel_id?: string;
  channel_name?: string;
  user_id?: string;
  user_name?: string;
  team_id?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  if (!timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > 60 * 5) return false;
  const base = `v0:${timestamp}:${rawBody}`;
  const digest = createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${digest}`;
  const a = Buffer.from(expected, "utf-8");
  const b = Buffer.from(signature, "utf-8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function writeJson(res: ServerResponse, statusCode: number, body: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseOrchText(text: string): { profile: string; target: string; task: string; extra: string[] } {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  let profile = process.env.ORCH_PROFILE || "strict";
  let target = process.env.ORCH_TARGET_BRANCH || "dev";
  let task = process.env.TASK_ID || `task-${Date.now()}`;
  const extra: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if ((t === "--profile" || t === "-p") && tokens[i + 1]) {
      profile = tokens[i + 1];
      i += 1;
      continue;
    }
    if ((t === "--target" || t === "-t") && tokens[i + 1]) {
      target = tokens[i + 1];
      i += 1;
      continue;
    }
    if ((t === "--task" || t === "--task-id") && tokens[i + 1]) {
      task = tokens[i + 1];
      i += 1;
      continue;
    }
    extra.push(t);
  }
  return { profile, target, task, extra };
}

async function main(): Promise<void> {
  const signingSecret = requireEnv("SLACK_SIGNING_SECRET");
  const botToken = requireEnv("SLACK_BOT_TOKEN");
  const host = process.env.SLACK_COMMAND_HOST || "127.0.0.1";
  const port = Number(process.env.SLACK_COMMAND_PORT || "3131");
  const projectDir = process.env.PROJECT_DIR || process.cwd();

  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        writeJson(res, 200, { ok: true, service: "slack-command-server", at: new Date().toISOString() });
        return;
      }
      if (req.method !== "POST" || req.url !== "/slack/commands/orch") {
        writeJson(res, 404, { ok: false, error: "not_found" });
        return;
      }

      const rawBody = await readBody(req);
      const sig = String(req.headers["x-slack-signature"] || "");
      const ts = String(req.headers["x-slack-request-timestamp"] || "");
      if (!verifySlackSignature(signingSecret, ts, rawBody, sig)) {
        writeJson(res, 401, { ok: false, error: "invalid_signature" });
        return;
      }

      const params = new URLSearchParams(rawBody);
      const payload: SlackCommandPayload = {
        command: params.get("command") || undefined,
        text: params.get("text") || undefined,
        channel_id: params.get("channel_id") || undefined,
        channel_name: params.get("channel_name") || undefined,
        user_id: params.get("user_id") || undefined,
        user_name: params.get("user_name") || undefined,
        team_id: params.get("team_id") || undefined
      };

      const parsed = parseOrchText(payload.text || "");
      const channelId = payload.channel_id || process.env.SLACK_CHANNEL_ID || "";
      if (!channelId) {
        writeJson(res, 200, {
          response_type: "ephemeral",
          text: "채널 ID를 확인할 수 없습니다. 채널에서 실행하거나 SLACK_CHANNEL_ID를 설정하세요."
        });
        return;
      }

      writeJson(res, 200, {
        response_type: "ephemeral",
        text: [
          "오케스트레이션 실행을 시작했습니다.",
          `profile=${parsed.profile}`,
          `target=${parsed.target}`,
          `task=${parsed.task}`
        ].join(" ")
      });

      const child = spawn(
        "npm",
        [
          "run",
          "orch:slack",
          "--",
          "--profile",
          parsed.profile,
          "--target",
          parsed.target,
          "--task-id",
          parsed.task
        ],
        {
          cwd: projectDir,
          shell: true,
          detached: true,
          stdio: "ignore",
          env: {
            ...process.env,
            SLACK_BOT_TOKEN: botToken,
            SLACK_CHANNEL_ID: channelId,
            TASK_ID: parsed.task,
            ORCH_PROFILE: parsed.profile,
            ORCH_TARGET_BRANCH: parsed.target
          }
        }
      );
      child.unref();
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: "server_error",
        message: (error as Error).message
      });
    }
  });

  server.listen(port, host, () => {
    process.stdout.write(`[slack-command-server] listening on http://${host}:${port}\n`);
    process.stdout.write("[slack-command-server] endpoint: POST /slack/commands/orch\n");
  });
}

main().catch((error) => {
  process.stderr.write(`slack command server failed: ${(error as Error).message}\n`);
  process.exit(1);
});

