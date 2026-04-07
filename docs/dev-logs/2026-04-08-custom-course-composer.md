# 커스텀 강의 조립

## 문서 유형
기록 허브입니다. `#24` 커스텀 강의 조립과 담아가기 구현 비교 결과를 남깁니다.

---

## 변경 요약
- A안은 `packages/shared/src/custom-course.ts`와 `backend/src/routes/custom-courses.ts`로 기능을 분리했다.
- B안은 `courses.ts` 안에 커스텀 강의 API를 합치는 방식이었지만, 파일 길이와 책임 분리에서 불리했다.
- A안의 파일 수는 더 많지만, `courses.ts`를 건드리지 않고 커스텀 강의 도메인을 독립시킬 수 있어서 유지보수성이 높았다.
- 비교 결과:
  - A안: 신규 route/helper 2개 + 문서 갱신, `courses.ts` 비침범, `npm run build` 통과
  - B안: `backend/src/routes/courses.ts` 348줄 추가, `npm run build` 통과
- 파일 분리 기준과 현재 구조를 함께 보면 A안이 더 안정적이다.

## 검증
- `npm run build`
