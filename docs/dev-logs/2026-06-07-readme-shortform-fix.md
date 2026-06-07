# README Refresh and Shortform Flow Fix

## 범위
- README / README.en.md를 현재 실행 구조와 배포 기준에 맞게 최신화
- shortform wizard가 extraction_id 기반으로 생성되도록 수정
- 선택 클립/미리보기 경로를 clip id 기준으로 일치시킴

## 결과
- `README.md` 최신화
- `README.en.md` 최신화
- `frontend/src/features/lms/components/useShortformWizardStateCore.ts` 수정
- `frontend/src/features/lms/components/useShortformWizardActions.ts` 수정
- `frontend/src/lib/shortforms/shortform-read.ts` 수정

## 검증
- `npm run build:frontend`
- 브라우저에서 데모 수강생 로그인 후 숏폼 생성 성공 확인
- dev 배포 최신화 확인

## 비고
- 문서와 실제 실행 경로가 어긋나지 않도록 README의 실행/배포 설명을 현재 코드 기준으로 정렬했다.
- 숏폼 생성은 선택된 후보와 추출 ID를 함께 사용하도록 바꿔 실제 생성 흐름을 복구했다.