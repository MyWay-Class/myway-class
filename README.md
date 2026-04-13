# 내맘대로클래스 (MyWayClass)

<p align="left">
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Hono-Backend-orange" />
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/2026_KIT_바이브코딩-공모전-6366f1" />
</p>

> 강의를 통째로 다시 보지 않아도 되도록,  
> **강의 안의 핵심 구간만 골라 바로 학습**할 수 있게 만드는 AI 기반 LMS 플랫폼  
> 2026 KIT 바이브코딩 공모전 제출작 · 제작자: 신동구

---

## 📌 해결하는 문제

온라인 강의는 이미 5~10분 단위로 쪼개져 있습니다.  
하지만 실제로 다시 봐야 하는 핵심은 그중 **2~3분**에 불과합니다.

- 특정 개념 하나를 위해 전체 영상 반복 탐색
- 영상이 많아질수록 탐색 비용 증가
- 결국 “짧은 영상 N개짜리 긴 강의”가 됨

👉 문제의 본질: **탐색 비용**

---

## 💡 핵심 기능

| 기능 | 설명 |
|------|------|
| 강의 시청 | 타임스탬프 기반 스크립트 연동 |
| 숏폼 생성 | 핵심 구간만 추출 |
| AI 요약 | 자동 요약 노트 |
| AI 채팅 | RAG 기반 질의응답 |
| 퀴즈 생성 | 자동 문제 생성 |
| STT 파이프라인 | 오디오 → 텍스트 → 청킹 |
| 강의 스튜디오 | 강의 생성/수정 |
| 대시보드 | 학생/강사/관리자 분리 |
| 숏폼 공유 | 수강생 간 공유 |
| 미디어 파이프라인 | 업로드 → 처리 → 추적 |

---

## 🔁 동작 흐름


영상 업로드
→ 오디오 추출 (ffmpeg)
→ STT (텍스트 변환)
→ 의미 단위 청킹
→ RAG 검색
→ AI 처리 (요약/퀴즈/QA)
→ 핵심 구간 추출
→ 숏폼 생성


👉 결과는 항상 원본 강의와 연결됨

---

## ⚙️ 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Hono, Cloudflare Workers |
| AI | Gemini, Whisper, Ollama |
| DB | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Media | ffmpeg |
| Shared | packages/shared |

---

## 🧩 프로젝트 구조


myway-class/
├── frontend/
├── backend/
├── packages/shared/
├── scripts/
├── docs/
├── agent.md
└── README.md


---

## 🚀 실행 방법

### 요구 사항
- Node.js 20+
- npm 10+

### 설치

git clone https://github.com/MyWay-Class/myway-class.git

cd myway-class
npm install


### 실행

npm run dev


- frontend: 5173
- backend: 8787
- media: 8788

---

## 🤖 AI 활용 전략

### 📌 기본 원칙

LLM은 **확률 기반 시스템**이다.  
→ 결과는 신뢰 대상이 아니라 **검증 대상**

---

### 🔥 핵심 구조


사람 (기준 정의)
↓
AI (실행)
↓
사람 (검증 및 채택)


👉 Human-in-the-loop 유지

---

## ⚙️ AI 협업 시스템

### 1️⃣ 명세 기반 작업

- Pseudo-code 수준 지시
- 파일 + 라인 지정
- 모호한 요청 제거

---

### 2️⃣ 워킹트리 병렬 비교


A안 / B안 생성 → 비교 → 채택


#### 기준
- 기획 의도 일치
- 최소 변경
- 검증 용이성
- 문서 일치

👉 결과 편차를 구조적으로 제어

---

### 3️⃣ agent.md 기반 제어

AI 행동을 제한하는 계약서

구성:
- Role
- Scope
- Constraints
- Output
- Validation

---

### 4️⃣ 검증 시스템

- 타입 체크
- JSON 파싱
- fallback 동작
- 사이드이펙트 검증

---

### 5️⃣ 문서 중심 개발


docs/
├── architecture/
├── conventions/
├── ai-context/
├── dev-logs/


👉 문서 = 기준 / 코드 = 결과

---

### 6️⃣ 토큰 최적화

- 문서 참조 방식
- 병렬 생성 후 선택
- agent.md 최소화

---

### 7️⃣ 재현성 확보


docs/dev-logs/

A안 vs B안
선택 근거

👉 동일 문제 재사용 가능

---

## 🧑‍💻 역할

> Product Architect & Implementation Orchestrator

- AI 사용 ❌  
- AI 시스템 설계 ✅

---

## 🔁 개발 프로세스


설계 → 문서화 → 구현 → 검증 → 기록


---

## 📚 문서

| 문서 | 설명 |
|------|------|
| agent.md | AI 협업 기준 |
| docs/dev-logs | 의사결정 기록 |
| docs/ai-context | AI 컨텍스트 |
| docs/conventions | 코드 규칙 |

---

## 🚀 배포

| 환경 | Frontend | Backend |
|------|----------|--------|
| dev | Vite | Wrangler |
| prod | Cloudflare Pages | Workers |

---

## 🎯 핵심 철학

- AI는 대체자가 아니라 **실행 도구**
- 사람은 기준을 정의
- 결과는 항상 검증
- 강의는 “재생”이 아니라 “재구성”

---

## 📜 라이선스

MIT License  
2026 KIT 바이브코딩 공모전 제출작
