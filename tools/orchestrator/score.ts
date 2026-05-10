import { readFileSync } from "node:fs";
import YAML from "yaml";
import type { CheckResult, CheckName } from "./checks";

interface Rules {
  weights: Record<CheckName, number>;
  required: Partial<Record<CheckName, { min: number; fail_fast?: boolean }>>;
  cutoff: { total_min: number };
}

interface WaiverItem {
  metric: CheckName;
  branch?: string;
  expires_at: string;
  reason: string;
  approved_by: string;
}

interface WaiverConfig {
  waivers?: WaiverItem[];
}

export interface Scorecard {
  taskId: string;
  scores: Record<CheckName, number>;
  required_pass: boolean;
  required_failed: CheckName[];
  waived_required: CheckName[];
  waiver_notes: string[];
  fail_fast_triggered: boolean;
  total: number;
  verdict: "approve" | "reject";
  notes: string[];
  timestamp: string;
}

export function loadRules(path: string): Rules {
  return YAML.parse(readFileSync(path, "utf-8")) as Rules;
}

export function loadWaivers(path: string): WaiverConfig {
  return YAML.parse(readFileSync(path, "utf-8")) as WaiverConfig;
}

function metricScore(check: CheckResult): number {
  if (check.skipped) return 70;
  return check.pass ? 90 : 40;
}

export function buildScorecard(
  taskId: string,
  checks: CheckResult[],
  rules: Rules,
  opts?: { waivers?: WaiverConfig; branch?: string; nowIso?: string }
): Scorecard {
  const scores = {
    tests: metricScore(checks.find((c) => c.name === "tests")!),
    style: metricScore(checks.find((c) => c.name === "style")!),
    security: metricScore(checks.find((c) => c.name === "security")!),
    performance: metricScore(checks.find((c) => c.name === "performance")!)
  };

  const total = Number((
    scores.tests * rules.weights.tests +
    scores.style * rules.weights.style +
    scores.security * rules.weights.security +
    scores.performance * rules.weights.performance
  ).toFixed(2));

  const nowMs = Date.parse(opts?.nowIso || new Date().toISOString());
  const branch = opts?.branch || "dev";
  const activeWaivers = (opts?.waivers?.waivers || []).filter((w) => {
    const expireMs = Date.parse(w.expires_at);
    const branchMatch = !w.branch || w.branch === branch;
    return branchMatch && Number.isFinite(expireMs) && expireMs >= nowMs;
  });
  const waivedRequired = new Set<CheckName>(activeWaivers.map((w) => w.metric));
  const waiverNotes = activeWaivers.map((w) => `${w.metric}:${w.reason} (by ${w.approved_by}, until ${w.expires_at})`);

  const requiredFailedRaw = Object.entries(rules.required)
    .filter(([key, value]) => {
      const metric = key as CheckName;
      return scores[metric] < (value?.min ?? 0);
    })
    .map(([key]) => key as CheckName);
  const requiredFailed = requiredFailedRaw.filter((metric) => !waivedRequired.has(metric));
  const requiredPass = requiredFailed.length === 0;
  const failFastTriggered = Object.entries(rules.required).some(([key, value]) => {
    const metric = key as CheckName;
    return Boolean(value?.fail_fast) && scores[metric] < (value?.min ?? 0) && !waivedRequired.has(metric);
  });

  const pass = !failFastTriggered && total >= rules.cutoff.total_min && requiredPass;
  const notes = pass
    ? ["review rules satisfied"]
    : [
        "review rules not satisfied",
        requiredFailed.length > 0 ? `required_failed=${requiredFailed.join(",")}` : "required_failed=none",
        failFastTriggered ? "fail_fast_triggered=true" : "fail_fast_triggered=false"
      ];
  return {
    taskId,
    scores,
    required_pass: requiredPass,
    required_failed: requiredFailed,
    waived_required: [...waivedRequired],
    waiver_notes: waiverNotes,
    fail_fast_triggered: failFastTriggered,
    total,
    verdict: pass ? "approve" : "reject",
    notes,
    timestamp: new Date().toISOString()
  };
}
