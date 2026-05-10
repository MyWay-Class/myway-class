import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type JsonObject = Record<string, unknown>;

interface AuditEvent extends JsonObject {
  taskId?: string;
  traceId?: string;
  at?: string;
  type?: string;
  decision?: string;
  state?: string;
  requested?: string[];
  results?: Array<{ code: string; command: string; pass: boolean }>;
}

function parseArgs(argv: string[]): { days: number | null; top: number } {
  let days: number | null = null;
  let top = 5;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--days") {
      const raw = argv[i + 1];
      if (raw && !Number.isNaN(Number(raw))) {
        days = Number(raw);
        i += 1;
      }
    }
    if (token === "--top") {
      const raw = argv[i + 1];
      if (raw && !Number.isNaN(Number(raw))) {
        top = Math.max(1, Number(raw));
        i += 1;
      }
    }
  }
  return { days, top };
}

function readJsonl(path: string): AuditEvent[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as AuditEvent;
      } catch {
        return {};
      }
    });
}

function topN(entries: Map<string, number>, n: number): Array<[string, number]> {
  return [...entries.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function main(): void {
  const { days, top } = parseArgs(process.argv.slice(2));
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  const workspaceDir = join(projectDir, "_workspace");
  const logsDir = join(workspaceDir, "logs");
  const auditPath = join(logsDir, "audit-events.jsonl");
  const allAudit = readJsonl(auditPath);
  const cutoffMs = days !== null ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
  const audit = allAudit.filter((e) => {
    if (cutoffMs === null) return true;
    const at = e.at ? Date.parse(String(e.at)) : Number.NaN;
    return Number.isFinite(at) && at >= cutoffMs;
  });

  const decisions = audit.filter((e) => e.type === "decision");
  const recoveries = audit.filter((e) => e.type === "code-based-recovery");
  const reruns = audit.filter((e) => e.type === "remediation-round");

  const stateCount = new Map<string, number>();
  for (const d of decisions) {
    const state = String(d.state || "unknown");
    stateCount.set(state, (stateCount.get(state) || 0) + 1);
  }

  const codeCount = new Map<string, number>();
  for (const recovery of recoveries) {
    const requested = Array.isArray(recovery.requested) ? recovery.requested : [];
    for (const code of requested) {
      codeCount.set(String(code), (codeCount.get(String(code)) || 0) + 1);
    }
  }

  let recoveryAttempted = 0;
  let recoveryPassed = 0;
  for (const recovery of recoveries) {
    const results = Array.isArray(recovery.results) ? recovery.results : [];
    for (const r of results) {
      recoveryAttempted += 1;
      if (r && r.pass) recoveryPassed += 1;
    }
  }

  const latest = decisions.slice(-1)[0];
  const latestSummary = latest
    ? {
        taskId: latest.taskId || "n/a",
        traceId: latest.traceId || "n/a",
        state: latest.state || "n/a",
        at: latest.at || "n/a"
      }
    : null;

  const report = {
    source: auditPath,
    totals: {
      events: audit.length,
      decisions: decisions.length,
      remediationRounds: reruns.length,
      codeRecoveries: recoveries.length
    },
    latestDecision: latestSummary,
    stateBreakdown: Object.fromEntries(stateCount.entries()),
    topRequestChangeCodes: topN(codeCount, top).map(([code, count]) => ({ code, count })),
    recoveryStats: {
      attemptedCommands: recoveryAttempted,
      passedCommands: recoveryPassed,
      passRate: recoveryAttempted > 0 ? Number(((recoveryPassed / recoveryAttempted) * 100).toFixed(2)) : null
    },
    filters: { days, top }
  };

  process.stdout.write(JSON.stringify(report, null, 2));
}

main();
