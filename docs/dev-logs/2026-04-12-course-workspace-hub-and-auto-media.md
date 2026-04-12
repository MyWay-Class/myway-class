# 2026-04-12 강의 워크스페이스 허브와 자동 미디어 연결

## 목적
- 분리되어 있던 `강의 개설`, `강의 제작 스튜디오`, `미디어 파이프라인` 흐름을 한 화면의 탭 구조로 묶는다.
- 강의 개설 후 영상 파일이 선택되어 있으면 첫 차시에 대해 업로드와 오디오 추출을 자동으로 이어서 처리한다.
- 강사 기본 진입점을 워크스페이스 허브로 옮겨, 처음부터 한 화면에서 제작을 시작하게 한다.

## 변경 사항
- [`frontend/src/features/lms/pages/CourseCreatePage.tsx`](C:/Users/ggg99/Desktop/내맘대로Class/myway-class/frontend/src/features/lms/pages/CourseCreatePage.tsx)
  - `강의 개설`, `제작 스튜디오`, `미디어 파이프라인` 탭을 한 페이지에 배치했다.
  - 첫 차시 영상 파일 입력과 자동 추출 토글을 추가했다.
  - 강의 개설 성공 시 영상이 선택되어 있으면 업로드와 추출을 자동 실행하고, 결과에 따라 스튜디오 또는 미디어 탭으로 넘긴다.
- [`frontend/src/features/lms/pages/RolePageRouter.tsx`](C:/Users/ggg99/Desktop/내맘대로Class/myway-class/frontend/src/features/lms/pages/RolePageRouter.tsx)
  - 강의 개설 페이지에 현재 선택 강의와 세션 토큰을 넘겨 탭 내부에서 스튜디오와 미디어 화면을 재사용하게 했다.
- [`frontend/src/features/lms/config.ts`](C:/Users/ggg99/Desktop/내맘대로Class/myway-class/frontend/src/features/lms/config.ts)
  - 강사 기본 진입점을 `course-create`로 바꿔 워크스페이스 허브에서 시작하게 했다.
  - 메뉴와 제목을 `강의 워크스페이스`로 정리했다.
- [`frontend/src/features/lms/components/CourseCreateCard.tsx`](C:/Users/ggg99/Desktop/내맘대로Class/myway-class/frontend/src/features/lms/components/CourseCreateCard.tsx)
  - 생성 후 연결 안내 문구를 워크스페이스 기준으로 맞췄다.

## 검증
- `npm run verify` 통과

## 판단
- 강의 개설을 별도 페이지로 두는 대신 허브화하는 편이 실제 작업 흐름에 더 가깝다.
- 영상 업로드와 STT 추출은 개설 후 자동으로 시작하는 편이 사용자 조작 수를 줄인다.
- 별도 페이지는 유지하되, 허브 안에서 같은 컴포넌트를 재사용해 이동 비용을 낮췄다.
