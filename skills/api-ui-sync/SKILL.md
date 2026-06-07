---
name: api-ui-sync
description: "myway-class에서 backend API와 frontend UI 연동을 함께 변경하거나 응답 계약 불일치를 수정할 때 반드시 사용하는 스킬. API shape 변경, 상태코드 변경, 필드 rename, 연동 버그 요청에서 트리거한다."
---

# API UI Sync

1. Confirm current backend response shape first.
2. Update frontend types/hooks/components to match.
3. Validate error-state rendering and fallback behavior.
4. Record impacted endpoints and UI screens.
