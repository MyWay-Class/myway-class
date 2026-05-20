# 시스템 아키텍처

## 목적
전체 시스템의 큰 경계만 빠르게 확인할 수 있게 한다.

## 역할
- 이 문서는 요약용 아키텍처 허브다.
- 구현 기준의 상세 내용은 `docs/project/02-architecture.md`를 따른다.
- 경계와 배포 구조를 먼저 파악할 때만 읽는다.

## 한눈에 보기
- 프론트엔드: `frontend/`
- 백엔드: `backend/`
- 공통 계약: `packages/shared/`
- 공통 문서: `docs/`

## 핵심 원칙
- 프론트는 백엔드 API만 호출한다.
- 프론트 배포는 Cloudflare Pages를 사용한다.
- 백엔드 API의 주 실행 경로는 Spring(`backend-spring/`)이며, 주 데이터 저장소는 Supabase PostgreSQL이다.
- Cloudflare Workers/D1은 보조 경로(캐시/실험/점진 이관)로만 사용한다.
- 대용량 파일과 미디어는 R2에 둔다.
- 메타데이터와 핵심 도메인 데이터의 단일 진실 원천(SoT)은 Supabase PostgreSQL로 유지한다.

## 상세 문서
- 시스템 동작 순서: `docs/project/02-architecture.md`
- 모듈 책임 분리: `docs/project/03-module-structure.md`
