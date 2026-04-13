import { useEffect, useMemo, useState } from 'react';
import type { LectureDetail, SmartChatResult } from '@myway/shared';
import { sendSmartChatDetailed } from '../../../lib/api';
import { StatePanel } from './StatePanel';
import { AIChatComposer } from './AIChatComposer';
import { AIChatThread, type AIChatMessage } from './AIChatThread';

type LectureSideChatPanelProps = {
  highlightedLecture: LectureDetail | null;
  sessionToken?: string | null;
};

function createWelcomeMessage(highlightedLecture: LectureDetail | null): AIChatMessage {
  return {
    id: `side-chat-welcome-${highlightedLecture?.id ?? 'none'}`,
    role: 'assistant',
    content: highlightedLecture
      ? `${highlightedLecture.title}를 보고 있다면 핵심 개념, 요약, 시험 대비 질문을 바로 물어볼 수 있습니다.`
      : '강의를 선택하면 우측에서 강의 전용 챗봇을 사용할 수 있습니다.',
    suggestions: highlightedLecture
      ? ['핵심 개념 요약', '시험 대비 문제', '이전 강의와 연결', '숏폼으로 복습']
      : ['강의를 먼저 선택해 주세요.'],
  };
}

function mapSmartChatResult(result: SmartChatResult): AIChatMessage {
  return {
    id: `side-chat-assistant-${Date.now()}`,
    role: 'assistant',
    content: result.answer,
    references: result.references,
    suggestions: result.suggestions,
    intent: result.intent,
  };
}

export function LectureSideChatPanel({ highlightedLecture, sessionToken }: LectureSideChatPanelProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => [createWelcomeMessage(highlightedLecture)]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState('선택한 강의에 맞춰 질문할 수 있습니다.');

  useEffect(() => {
    setMessages([createWelcomeMessage(highlightedLecture)]);
    setInput('');
    setStatusText(
      highlightedLecture
        ? `${highlightedLecture.course_title} · ${highlightedLecture.course_instructor}`
        : '강의를 선택하면 챗봇이 활성화됩니다.',
    );
  }, [highlightedLecture?.id, highlightedLecture?.title, highlightedLecture?.course_instructor, highlightedLecture?.course_title]);

  const quickPrompts = useMemo(
    () =>
      highlightedLecture
        ? ['핵심 개념 요약', '시험 대비 문제', '이전 강의와 연결', '숏폼으로 복습']
        : ['강의를 먼저 선택해 주세요.'],
    [highlightedLecture],
  );

  async function handleSubmit(messageText = input) {
    const message = messageText.trim();
    if (!message || sending || !highlightedLecture) {
      return;
    }

    setInput('');
    setSending(true);
    setMessages((current) => [
      ...current,
      {
        id: `side-chat-user-${Date.now()}`,
        role: 'user',
        content: message,
      },
    ]);

    try {
      const response = await sendSmartChatDetailed(
        {
          message,
          lecture_id: highlightedLecture.id,
          context: [highlightedLecture.title, highlightedLecture.course_title],
        },
        sessionToken,
      );

      const result = response?.success ? response.data : null;
      if (result) {
        setMessages((current) => [...current, mapSmartChatResult(result)]);
        setStatusText(`응답 완료 · ${result.provider ?? 'demo'} / ${result.model ?? 'unknown'}`);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `side-chat-fallback-${Date.now()}`,
          role: 'assistant',
          content: `${highlightedLecture.title} 기준으로는 핵심 개념부터 다시 살펴보는 게 좋습니다. 질문을 조금 더 구체적으로 바꿔 주세요.`,
          suggestions: quickPrompts,
        },
      ]);
      setStatusText('응답을 가져오지 못했습니다. 로컬 안내로 대체했습니다.');
    } finally {
      setSending(false);
    }
  }

  if (!highlightedLecture) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <StatePanel
          compact
          icon="ri-chat-3-line"
          tone="indigo"
          title="강의를 선택하면 사이드 챗봇이 열립니다."
          description="강의 상세를 선택하면 우측에서 바로 질문하고 답변을 확인할 수 있습니다."
        />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] font-semibold text-indigo-600">강의 시청 챗봇</div>
            <h3 className="mt-1 text-[15px] font-bold text-slate-900">우측 사이드 질문</h3>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">{statusText}</p>
          </div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
            {highlightedLecture.week_number ?? 1}주차 · {highlightedLecture.session_number ?? highlightedLecture.order_index + 1}차시
          </div>
        </div>

        <div className="mt-3 grid gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-[12px] text-slate-600">
          <div className="flex items-center gap-2 font-semibold text-indigo-700">
            <i className="ri-lightbulb-flash-line" />
            지금 강의에 바로 물어보기
          </div>
          <div>스크립트 탭에서 타임스탬프를 확인한 뒤, 해당 구간의 개념이나 예시를 챗봇에 이어서 질문할 수 있습니다.</div>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <div className="text-[12px] font-semibold text-slate-500">{highlightedLecture.course_title}</div>
            <div className="mt-1 text-[15px] font-bold tracking-[-0.03em] text-slate-900">{highlightedLecture.title}</div>
            <div className="mt-1 text-[12px] text-slate-500">{highlightedLecture.course_instructor}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">강의 질문</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">타임스탬프 참고</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">핵심 요약</span>
            </div>
          </div>

          <AIChatThread messages={messages} loading={sending} />
        </div>
      </div>

      <AIChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSubmit()}
        quickPrompts={quickPrompts}
        onQuickPrompt={(prompt) => {
          setInput(prompt);
          void handleSubmit(prompt);
        }}
        disabled={sending}
      />
    </section>
  );
}
