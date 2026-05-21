# Harness Routing Eval Report (2026-05-13)

## Scope
- Repository: `myway-class`
- Target: `myway-class-orchestrator` trigger and conditional routing
- Sample set: 20 prompts

## Confusion Matrix
- TP: 16
- TN: 4
- FP: 0
- FN: 0

## Metrics
- Accuracy: 1.0000
- Precision: 1.0000
- Recall: 1.0000
- F1: 1.0000
- False Positive Rate: 0.0000
- False Negative Rate: 0.0000

## Criteria Check
1. `false_positive_rate <= 0.10` -> PASS
2. `false_negative_rate <= 0.10` -> PASS
3. `recall >= 0.90` -> PASS
4. No FN on `debug/security/docs/gitops` branches -> PASS

## Conclusion
- Phase 2 measurement completed.
- Phase 3 correction step not required because all thresholds are satisfied.
