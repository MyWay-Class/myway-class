# 문서 가이드

> MyWayClass에서 AI와 협업하며 일관된 개발을 진행하기 위한 문서 모음

## 문서 유형
허브 문서입니다. 다른 문서의 원본, 요약, 기록 위치를 안내합니다.

### 유형 기준
| 유형 | 의미 | 예시 |
|------|------|------|
| 원본 | 기준이 되는 본문 문서 | `agent.md`, `docs/project/*` |
| 요약 허브 | 상세 문서를 읽기 전에 방향을 잡는 문서 | `docs/context/README.md`, `docs/structure/README.md` |
| 기록 허브 | 결정 이유와 변경 흐름을 남기는 문서 | `docs/dev-logs/README.md` |
| 보조 원본 | 특정 영역의 특수 기준을 담는 문서 | `docs/ai-context/agent.md` |
| 보조 요약 | 빠른 운영 체크만 담는 문서 | `docs/ops/agent/agent.md` |
---

## 문서 구조

```text
docs/
├── README.md                # 문서 허브
├── project/                 # 프로젝트 핵심 문서
│
├── context/                 # 프로젝트 컨텍스트
├── conventions/             # 코딩 컨벤션
├── structure/               # 모듈별 상세 구조
├── dev-logs/                # 개발 로그
├── ai-context/              # AI 협업 규칙
├── frontend/docs/           # 프론트엔드 문서 허브
├── backend/docs/            # 백엔드 문서 허브
└── ops/                     # 운영용 보조 문서
```

---

## 현재 문서 관리 방식

| 구분 | 역할 |
|------|------|
| `docs/README.md` | 전체 문서의 출발점 |
| `docs/project/00-index.md` | 프로젝트 핵심 문서의 진입점 |
| `docs/context/` | 아키텍처, 모듈 구조, 환경 설정 |
| `docs/conventions/` | 공통 규칙과 세부 컨벤션 |
| `docs/structure/` | 기능별 API/구조 상세 |
| `docs/dev-logs/` | 개발 기록과 변경 이력 |
| `docs/ai-context/` | AI 작업 규칙 |
| `docs/ops/` | 짧은 운영용 보조 문서 |
| `frontend/docs/` | 프론트엔드 전용 문서 |
| `backend/docs/` | 백엔드 전용 문서 |

---

## 문서 활용 가이드

| 상황 | 참조 문서 |
|------|----------|
| AI 작업 시작 전 | `agent.md` |
| AI 협업 원칙 | `ai-context/agent.md`, `ai-context/harness-engineering.md` |
| 프로젝트 핵심 문서 | `project/00-index.md` |
| 로드맵 확인 | `project/PHASE-ROADMAP.md` |
| 모노레포 구성 확인 | `project/POLY-REPO.md` |
| 프론트 전용 문서 | `frontend/docs/README.md` |
| 백엔드 전용 문서 | `backend/docs/README.md` |
| 전체 구조 파악 | `context/architecture.md` |
| 모듈 배치 확인 | `context/module-structure.md` |
| 공통 규칙 확인 | `conventions/00-CONVENTIONS-CORE.md` |
| LLM 지시 가중치 | `ai-context/agent.md` |
| 워킹트리 비교 전략 | `conventions/07-WORKTREE-CONVENTIONS.md` |
| 터미널 지시 형식 | `conventions/08-LLM-CLI-TERMINAL.md` |

---

## 문서 운영 원칙

1. 한 문서는 한 책임만 가진다.
2. 문서가 길어지면 하위 문서로 쪼갠다.
3. 공통 규칙은 `conventions/`에 모은다.
4. 구조 설명은 `context/`에 모은다.
5. 기능별 상세는 `structure/`에 둔다.
6. 임시 메모나 진행 로그는 `dev-logs/`에 둔다.
7. 문서와 코드가 다르면 문서를 먼저 바로잡는다.

---

## 프로젝트 핵심 문서

프로젝트의 상세 기준 문서는 `docs/project/00-index.md` 아래에 모은다.
이 폴더가 MyWayClass의 기능/기획/구현 기준 문서의 출발점이다.
