# 구조 문서

> 기능별 상세 구조를 담는 문서 묶음

## 문서 유형
요약 허브입니다. 구현 상세의 원본은 하위 개별 문서에 둡니다.

---

## 포함 문서

| 문서 | 역할 |
|------|------|
| `backend/README.md` | 백엔드 구조 인덱스 |
| `backend/common/overview.md` | 공통 응답, 공통 유틸, 공통 에러 |
| `frontend/README.md` | 프론트엔드 구조 인덱스 |
| `frontend/api.md` | 프론트 API 통합 방식 |
| `frontend/pages.md` | 화면 구성 원칙 |

---

## 사용 원칙
- 공통 타입과 DTO의 원본은 `packages/shared`에 둔다.
- `backend/common/overview.md`는 백엔드가 공통 계약을 어떻게 사용하는지 적는 보조 문서로만 둔다.
- 브라우저 관련 내용은 `frontend/` 아래 문서에 둔다.
- 기능별 상세 문서는 짧고 명확하게 유지한다.
