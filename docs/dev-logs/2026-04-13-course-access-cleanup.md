# 2026-04-13 Course Access Cleanup

## Summary
- Removed legacy no-video / placeholder courses from dev learning data.
- Re-centered the AI course around `crs_ai_001` with the real lecture set and matching AI logs.
- Locked lecture playback, transcript, notes, extraction history, and smart chat behind enrollment.

## Verification
- `npm --workspace @myway/backend run build`
- `npm --workspace @myway/frontend run build`
- Dev API course list now returns only:
  - `crs_ai_001`
  - `crs_econ_seed_001`
  - `crs_eng_seed_001`
  - `crs_java_seed_001`
  - `crs_python_seed_001`
  - `crs_cert_seed_001`

## Deployment
- Dev backend redeployed on `myway-class-api-dev`
- Dev frontend redeployed on `mywayclass` branch `dev`
