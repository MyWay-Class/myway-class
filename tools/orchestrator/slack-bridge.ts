import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

type SlackMessage = {
  text: string;
  channel?: string;
  thread_ts?: string;
};

type ThreadEntry = {
  role?: string;
  message?: string;
  at?: string;
};

interface DecisionFile {
  taskId: string;
  traceId: string;
  state: "approved" | "rejected";
  decision: "approve" | "request_changes" | "reject";
  reason?: string;
  requestChangeCodes?: string[];
  timestamp?: string;
}

interface ScorecardFile {
  verdict?: "approve" | "reject";
  totalScore?: number;
  weightedScore?: number;
  checks?: Array<{ name: string; pass: boolean; score?: number }>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

function parseArgs(argv: string[]): { profile: string; targetBranch: string; taskId?: string; noRun: boolean } {
  let profile = process.env.ORCH_PROFILE || "strict";
  let targetBranch = process.env.ORCH_TARGET_BRANCH || "dev";
  let taskId: string | undefined;
  let noRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--profile" && argv[i + 1]) {
      profile = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--target" && argv[i + 1]) {
      targetBranch = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--task-id" && argv[i + 1]) {
      taskId = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--no-run") {
      noRun = true;
    }
  }

  return { profile, targetBranch, taskId, noRun };
}

function formatRole(role?: string): string {
  const normalized = (role || "agent").toLowerCase();
  if (normalized === "worker-a") return "Worker A";
  if (normalized === "worker-b") return "Worker B";
  if (normalized === "backend-dev") return "Backend Worker";
  if (normalized === "frontend-dev") return "Frontend Worker";
  if (normalized === "test-engineer") return "Test Worker";
  if (normalized === "docs-writer") return "Docs Worker";
  if (normalized === "critic") return "Critic";
  if (normalized === "manager") return "Manager";
  if (normalized === "reviewer") return "Reviewer";
  return role || "Agent";
}

async function slackApi(token: string, method: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (!data.ok) {
    const errorMessage = String(data.error || "unknown_error");
    throw new Error(`Slack API ${method} failed: ${errorMessage}`);
  }
  return data;
}

async function postSlack(token: string, msg: SlackMessage): Promise<string> {
  const response = await slackApi(token, "chat.postMessage", msg);
  return String(response.ts || "");
}

function readThreadEntries(threadPath: string): ThreadEntry[] {
  if (!existsSync(threadPath)) return [];
  return readFileSync(threadPath, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as ThreadEntry;
      } catch {
        return {};
      }
    });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(): Promise<void> {
  const { profile, targetBranch, taskId: cliTaskId, noRun } = parseArgs(process.argv.slice(2));
  const slackToken = requireEnv("SLACK_BOT_TOKEN");
  const slackChannel = requireEnv("SLACK_CHANNEL_ID");
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  const taskId = cliTaskId || process.env.TASK_ID || `task-${Date.now()}`;
  const traceId = process.env.TRACE_ID || `${taskId}-slack`;
  const workspaceDir = join(projectDir, "_workspace");
  const threadsDir = join(workspaceDir, "threads");
  const threadPath = join(threadsDir, `${taskId}.jsonl`);
  const decisionPath = join(workspaceDir, "decision.json");
  const scorecardPath = join(workspaceDir, "scorecard.json");

  const headerTs = await postSlack(slackToken, {
    channel: slackChannel,
    text: [
      `:robot_face: Orchestration started`,
      `taskId: ${taskId}`,
      `profile: ${profile}`,
      `target: ${targetBranch}`
    ].join("\n")
  });

  let procExited = false;
  let procExitCode: number | null = null;

  if (!noRun) {
    const child = spawn(
      "npm",
      ["run", "orch:run"],
      {
        cwd: projectDir,
        env: {
          ...process.env,
          TASK_ID: taskId,
          TRACE_ID: traceId,
          ORCH_PROFILE: profile,
          ORCH_TARGET_BRANCH: targetBranch
        },
        shell: true,
        stdio: "pipe"
      }
    );

    child.stdout.on("data", (data) => {
      process.stdout.write(data);
    });
    child.stderr.on("data", (data) => {
      process.stderr.write(data);
    });
    child.on("exit", (code) => {
      procExited = true;
      procExitCode = code;
    });
  } else {
    procExited = true;
    procExitCode = 0;
  }

  let sentCount = 0;
  let idleLoops = 0;
  while (!procExited || idleLoops < 3) {
    const entries = readThreadEntries(threadPath);
    if (entries.length > sentCount) {
      const newEntries = entries.slice(sentCount);
      for (const entry of newEntries) {
        const role = formatRole(entry.role);
        const text = entry.message || "";
        if (!text.trim()) continue;
        await postSlack(slackToken, {
          channel: slackChannel,
          thread_ts: headerTs,
          text: `*${role}*: ${text}`
        });
      }
      sentCount = entries.length;
      idleLoops = 0;
    } else if (procExited) {
      idleLoops += 1;
    }
    await sleep(1200);
  }

  let state = "unknown";
  let decision = "unknown";
  let reason = "";
  let changeCodes: string[] = [];
  if (existsSync(decisionPath)) {
    const data = JSON.parse(readFileSync(decisionPath, "utf-8")) as DecisionFile;
    state = data.state;
    decision = data.decision;
    reason = data.reason || "";
    changeCodes = data.requestChangeCodes || [];
  }

  let verdict = "unknown";
  let weightedScore: number | string = "n/a";
  let failedChecks: string[] = [];
  if (existsSync(scorecardPath)) {
    const score = JSON.parse(readFileSync(scorecardPath, "utf-8")) as ScorecardFile;
    verdict = score.verdict || "unknown";
    weightedScore = typeof score.weightedScore === "number" ? score.weightedScore : "n/a";
    failedChecks = (score.checks || []).filter((c) => !c.pass).map((c) => c.name);
  }

  const doneText = [
    `:white_check_mark: Orchestration finished`,
    `state: ${state}`,
    `decision: ${decision}`,
    `verdict: ${verdict}`,
    `weighted_score: ${weightedScore}`,
    `failed_checks: ${failedChecks.length ? failedChecks.join(", ") : "none"}`,
    `request_change_codes: ${changeCodes.length ? changeCodes.join(", ") : "none"}`,
    `reason: ${reason || "n/a"}`,
    `exit_code: ${procExitCode ?? "n/a"}`
  ].join("\n");

  await postSlack(slackToken, {
    channel: slackChannel,
    thread_ts: headerTs,
    text: doneText
  });

  if (procExitCode && procExitCode !== 0) {
    process.exit(procExitCode);
  }
}

run().catch((error) => {
  process.stderr.write(`slack bridge failed: ${(error as Error).message}\n`);
  process.exit(1);
});

