import { readFileSync } from "node:fs";
import YAML from "yaml";
import type { CheckResult, CheckName } from "./checks";

interface Rules {
  weights: Record<CheckName, number>;
  required: Partial<Record<CheckName, { min: number; fail_fast?: boolean }>>;
  cutoff: { total_min: number };
}

export interface Scorecard {
  taskId: string;
  scores: Record<CheckName, number>;
  required_pass: boolean;
  required_failed: CheckName[];
  fail_fast_triggered: boolean;
  total: number;
  verdict: "approve" | "reject";
  notes: string[];
  timestamp: string;
}

export function loadRules(path: string): Rules {
  return YAML.parse(readFileSync(path, "utf-8")) as Rules;
}

function metricScore(check: CheckResult): number {
  if (check.skipped) return 70;
  return check.pass ? 90 : 40;
}

export function buildScorecard(taskId: string, checks: CheckResult[], rules: Rules): Scorecard {
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

  const requiredFailed = Object.entries(rules.required)
    .filter(([key, value]) => {
      const metric = key as CheckName;
      return scores[metric] < (value?.min ?? 0);
    })
    .map(([key]) => key as CheckName);
  const requiredPass = requiredFailed.length === 0;
  const failFastTriggered = Object.entries(rules.required).some(([key, value]) => {
    const metric = key as CheckName;
    return Boolean(value?.fail_fast) && scores[metric] < (value?.min ?? 0);
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
    fail_fast_triggered: failFastTriggered,
    total,
    verdict: pass ? "approve" : "reject",
    notes,
    timestamp: new Date().toISOString()
  };
}
