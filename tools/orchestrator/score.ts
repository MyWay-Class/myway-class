import { readFileSync } from "node:fs";
import YAML from "yaml";
import type { CheckResult, CheckName } from "./checks";

interface Rules {
  weights: Record<CheckName, number>;
  required: Partial<Record<CheckName, { min: number }>>;
  cutoff: { total_min: number };
}

export interface Scorecard {
  taskId: string;
  scores: Record<CheckName, number>;
  required_pass: boolean;
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

  const requiredPass = Object.entries(rules.required).every(([key, value]) => {
    const metric = key as CheckName;
    return scores[metric] >= (value?.min ?? 0);
  });

  const pass = total >= rules.cutoff.total_min && requiredPass;
  return {
    taskId,
    scores,
    required_pass: requiredPass,
    total,
    verdict: pass ? "approve" : "reject",
    notes: pass ? ["review rules satisfied"] : ["review rules not satisfied"],
    timestamp: new Date().toISOString()
  };
}
