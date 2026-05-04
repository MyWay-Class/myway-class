# 내맘대로클래스

<p align="left">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Cloudflare_Workers-ready-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
</p>

[English README](./README.en.md)

강의를 개인화된 숏폼과 학습 흐름으로 다시 구성하는 LMS 플랫폼입니다.  
2026 KIT 바이브코딩 공모전 제출용 프로젝트로, 학습자에게는 필요한 구간만 빠르게 학습할 수 있는 경험을, 운영자와 강사에게는 강의 콘텐츠를 재가공하고 관리할 수 있는 도구를 제공합니다.

## 목차

- [개요](#개요)
- [문제 정의](#문제-정의)
- [핵심 기능](#핵심-기능)
- [동작 흐름](#동작-흐름)
- [스크린샷](#스크린샷)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [주요 화면](#주요-화면)
- [실행 방법](#실행-방법)
- [스크립트](#스크립트)
- [CI 운영](#ci-운영)
- [문서](#문서)
- [설계 방향](#설계-방향)

## 개요

긴 강의를 끝까지 다시 보지 않아도 되도록, 강의 안의 핵심 구간만 골라 바로 학습할 수 있게 만드는 AI 기반 학습 플랫폼입니다.

## 문제 정의

온라인 강의는 짧게 쪼개져 보여도, 실제로 다시 확인해야 하는 핵심은 보통 2~3분 정도에 불과한 경우가 많습니다.  
하지만 기존 LMS에서는 여전히 전체 영상을 다시 재생하며 원하는 구간을 직접 찾아야 하고, 강의가 쌓일수록 탐색 비용이 커집니다.

`내맘대로클래스`는 이 문제를 해결하기 위해 다음을 목표로 합니다.

- 필요한 구간만 빠르게 찾을 수 있게 한다
- 강의를 목적별 학습 자료로 재구성한다
- 숏폼, 요약, 퀴즈, 질의응답을 통해 반복 학습을 줄인다
- 학습자와 강사 모두가 다시 활용 가능한 콘텐츠 흐름을 만든다

## 핵심 기능

- 강의 시청 및 학습 대시보드
- 강의 스튜디오와 코스 관리
- 강의 내용을 다시 분해하는 숏폼 생성
- AI 요약, AI 채팅, 퀴즈 생성
- RAG 기반 질문 응답 및 관련 구간 탐색
- 미디어 업로드, 오디오 추출, 처리 파이프라인
- 학생, 강사, 관리자 화면 분리
- 숏폼 커뮤니티 및 공유 흐름

## 동작 흐름

이 프로젝트는 “강의 하나를 통째로 소비하는 방식”이 아니라, “강의 안의 유용한 조각들”을 다시 묶는 방식으로 설계했습니다.

기본 흐름은 아래와 같습니다.

1. 강의 오디오를 STT로 텍스트화한다
2. 텍스트를 의미 단위로 청킹한다
3. RAG로 질문이나 학습 목적에 맞는 근거 구간을 찾는다
4. AI가 요약, 퀴즈, 질의응답, 의도 분류를 수행한다
5. 필요한 구간만 남긴 학습용 숏폼으로 연결한다
6. 생성 결과는 원본 강의와 연결해 문맥을 바로 확인할 수 있게 한다

## 스크린샷

> 현재 저장소에는 실제 캡처 이미지가 없어서, 나중에 이미지만 교체하면 되는 자리표시자 형태로 정리했습니다.

| 화면 | 권장 파일명 | 설명 |
|------|------------|------|
| Home | `docs/screenshots/home.png` | 공개 홈 또는 랜딩 화면 |
| Dashboard | `docs/screenshots/dashboard.png` | 학습자 대시보드 |
| Shortform | `docs/screenshots/shortform.png` | 숏폼 생성/탐색 화면 |
| Lecture Studio | `docs/screenshots/lecture-studio.png` | 강의 스튜디오 |
| AI Chat | `docs/screenshots/ai-chat.png` | AI 채팅 화면 |
| Admin | `docs/screenshots/admin.png` | 관리자 화면 |

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Hono, TypeScript, Cloudflare Workers 계열 도구 |
| Shared | `packages/shared` 기반 공용 타입, 데이터, AI/LMS 로직 |
| Build | npm workspaces, esbuild, wrangler, TypeScript |
| Media | `ffmpeg-static` 기반 미디어 처리 |

## 프로젝트 구조

```text
myway-class/
├── frontend/           # 사용자 화면
├── backend/            # API, AI, 미디어 처리
├── packages/shared/    # 프론트/백엔드 공용 로직
├── docs/               # 공통 문서 허브
├── scripts/            # 개발 보조 스크립트
├── agent.md            # AI 협업 규칙
└── README.md           # 이 문서
```

## 주요 화면

- 공개 홈
- 학습자 대시보드
- 강의 목록 및 강의 시청
- 강의 스튜디오
- 숏폼 허브 및 내 숏폼 관리
- AI 요약 페이지
- AI 채팅 페이지
- 퀴즈 생성 페이지
- 관리자 대시보드, 통계, 사용자 관리
- 미디어 파이프라인 화면

## 실행 방법

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

전체 개발 환경을 함께 띄우는 진입점입니다.

프론트엔드와 백엔드를 분리해서 실행하고 싶다면 아래 명령을 사용합니다.

```bash
npm run dev:frontend
npm run dev:backend
```

### 검증 및 빌드

```bash
npm run verify
npm run build
```

- `npm run verify`는 의존성 확인, 미디어 프로세서 타입 체크, 백엔드 빌드, 프론트엔드 타입 체크를 묶어서 검사합니다.
- `npm run build`는 프론트엔드와 백엔드 빌드를 수행합니다.

## 스크립트

| 명령어 | 설명 |
|------|------|
| `npm run dev` | 전체 로컬 개발 실행 |
| `npm run dev:frontend` | 프론트엔드만 실행 |
| `npm run dev:backend` | 백엔드만 실행 |
| `npm run dev:media-processor` | 미디어 프로세서 번들 실행 |
| `npm run build` | 프론트엔드 + 백엔드 빌드 |
| `npm run verify` | 의존성, 타입, 빌드 검증 |
| `npm run check:media-processor` | 미디어 프로세서 타입 체크 |

## CI 운영

- 수동 실행: GitHub Actions에서 `backend-spring-tests` 워크플로우를 `Run workflow`로 직접 실행할 수 있습니다(`workflow_dispatch`).
- 동시 실행 제어: 같은 브랜치/워크플로우 조합으로 새 실행이 시작되면 기존 실행은 자동 취소됩니다(`concurrency`, `cancel-in-progress: true`).
- 타임아웃: `backend-spring-tests` 잡은 15분 제한이며, 초과 시 실패 처리됩니다(`timeout-minutes: 15`).

## 문서

- [`docs/README.md`](./docs/README.md): 전체 문서 허브
- [`agent.md`](./agent.md): AI 협업 규칙
- [`backend/docs/README.md`](./backend/docs/README.md): 백엔드 문서 허브
- [`README.en.md`](./README.en.md): 영문 README

## 설계 방향

- AI는 대체자가 아니라 보조자입니다.
- 결과는 가능한 한 구조화하고, fallback 경로를 둡니다.
- 문서와 코드의 기준을 맞추고, 변경 이유를 추적 가능하게 남깁니다.
- 강의는 단순 재생 대상이 아니라, 다시 조합 가능한 학습 자원으로 다룹니다.

## 라이선스

MIT License
