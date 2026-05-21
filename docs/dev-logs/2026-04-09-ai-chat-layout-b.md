# AI chat layout overhaul

**날짜**: 2026-04-09  
**관련 이슈**: #87  
**브랜치**: `feat/87-ai-chat-b`

## 변경 요약
- AI 챗봇 화면을 레퍼런스 v0.4.0의 고정 2컬럼 구조에 맞춰 재구성했다.
- 데스크톱에서는 채팅 영역과 보조 패널을 분리하고, 보조 패널은 sticky로 고정했다.
- 모바일에서는 토글 버튼으로 보조 패널을 열고 닫을 수 있게 했다.
- 입력 영역과 추천 프롬프트, RAG 파이프라인 요약을 유지하면서 실제 채팅 전송 흐름도 연결했다.

## 왜 B안을 선택했는가
- 레퍼런스의 핵심은 단순 2컬럼이 아니라, 데스크톱에서는 고정된 패널 감도와 모바일에서는 토글 구조가 함께 있어야 한다는 점이었다.
- B안은 채팅 thread, composer, sidebar를 분리해서 각 영역의 책임이 분명하고, sticky/mobile toggle을 자연스럽게 넣을 수 있었다.
- AI 엔진 구조는 건드리지 않고 화면 구조만 바꾸는 이번 이슈와 가장 잘 맞는 선택이었다.

## 바뀐 파일
- `frontend/src/features/lms/pages/AIChatPage.tsx`
- `frontend/src/features/lms/components/AIChatThread.tsx`
- `frontend/src/features/lms/components/AIChatComposer.tsx`
- `frontend/src/features/lms/components/AIChatSidebar.tsx`
- `docs/project/17-smart-ai-chat.md`
- `docs/project/20-status-and-next-steps.md`

## 확인 포인트
- 데스크톱은 `lg:grid-cols-[minmax(0,1fr)_360px]` 구조로 동작한다.
- 보조 패널은 `lg:sticky lg:top-6`로 고정된다.
- 모바일에서는 `도우미 패널` 버튼으로 사이드 패널을 열고 닫을 수 있다.
- 채팅 입력은 실제 `sendSmartChat` 흐름과 연결된다.
- 타입체크는 `npm exec --workspace @myway/frontend -- tsc -p tsconfig.json --noEmit`로 통과했다.
