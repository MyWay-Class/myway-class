# Harness Routing Eval Guide (Phase 2)

## Goal
- Measure false positives and false negatives using real routing samples.
- Scope: `myway-class-orchestrator` trigger/routing behavior.

## Sample Policy
1. Use at least 20 production-like prompts from the last 14 days.
2. Keep work requests vs simple questions near 7:3.
3. Include at least 2 samples each for `debug`, `security`, `docs`, `gitops`.

## Label Rules
1. `expected_trigger`: `Y` when orchestrator should be used, else `N`.
2. `actual_trigger`: `Y` when routing actually happened, else `N`.
3. `classification`:
- `TP`: expected Y, actual Y
- `TN`: expected N, actual N
- `FP`: expected N, actual Y
- `FN`: expected Y, actual N
4. Use `|` to separate multi-agent values in `expected_agents` and `actual_agents`.

## Run Aggregation
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\orchestrator\evaluate-routing.ps1 `
  -InputCsv _workspace\harness-routing-eval.csv `
  -OutJson _workspace\harness-routing-eval-summary.json
```

## Pass Criteria
1. `false_positive_rate <= 0.10`
2. `false_negative_rate <= 0.10`
3. `recall >= 0.90`
4. No FN on `debug/security/docs/gitops` routing samples

## If Failed
1. Update trigger phrases in `skills/myway-class-orchestrator/references/trigger-tests.md`.
2. Update routing clauses in `skills/myway-class-orchestrator/SKILL.md`.
3. Re-run evaluation with corrected samples.
