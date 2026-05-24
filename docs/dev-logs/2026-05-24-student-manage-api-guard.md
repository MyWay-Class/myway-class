# 2026-05-24 Student Manage API Guard

## Summary
- Prevented student role from calling `/api/v1/courses/manage` on My Courses page.
- Added contract assertion that demo student enrollment list is present and includes selected course.

## What changed
- `frontend/src/features/lms/pages/MyCoursesPage.tsx`
  - Skip `loadManagedCourses()` when role is `STUDENT`
  - Set student-specific notice and stop loading without forbidden API request
- `backend-spring/src/test/java/com/myway/backendspring/contract/StudentLearningFlowContractTest.java`
  - Added `/api/v1/enrollments` assertion
  - Verifies enrollment payload contains the selected `course_id`

## Verification
- `npm run build:frontend`
- `cd backend-spring && ./mvnw -q "-Dtest=StudentLearningFlowContractTest" test`

## Risk / Rollback
- Risk: low (role-based frontend request guard + additional test assertion).
- Rollback: revert this PR.
