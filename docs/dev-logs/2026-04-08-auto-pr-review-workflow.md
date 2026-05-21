# 2026-04-08 Auto PR Review Workflow

## 문서 유형
기록입니다. PR마다 자동 코드리뷰 코멘트를 남기는 GitHub Actions 워크플로우를 추가한 이유와 검증 범위를 남깁니다.

## 변경 이유
- PR에서 사람 리뷰 전 자동 요약 코멘트를 남기기 위해서다.
- draft PR과 fork PR은 제외해서 안전하게 동작하도록 했다.
- 같은 SHA에 같은 봇 리뷰가 중복되지 않도록 막았다.

## 변경 내용
- `.github/workflows/auto-pr-review.yml`를 추가했다.
- 변경 파일 목록을 읽어 프론트, 백엔드, shared, 문서, workflow 변경을 분류한다.
- PR 본문이 아니라 GitHub Review 댓글로 남긴다.

## 검증
- 워크플로우 문법은 GitHub Actions에서 실행되어야 최종 확인된다.
- 내부 브랜치 PR에 대해 `pull_request` 이벤트로만 동작한다.
