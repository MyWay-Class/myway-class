import { useEffect, useMemo, useState } from 'react';
import type { LectureDetail, SmartChatResult } from '@myway/shared';
import { sendSmartChatDetailed } from '../../../lib/api';
import { StatePanel } from './StatePanel';
import { AIChatComposer } from './AIChatComposer';
import { AIChatThread, type AIChatMessage } from './AIChatThread';
import {
  LectureSideChatPanelHeaderSection,
  LectureSideChatPanelEmptyState,
  LectureSideChatPanelBodySection,
} from './LectureSideChatPanelSections';

type LectureSideChatPanelProps = {
  highlightedLecture: LectureDetail | null;
  sessionToken?: string | null;
  onSeekTimestamp?: (startMs: number, lectureId?: string | null) => void;
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

export function LectureSideChatPanel({ highlightedLecture, sessionToken, onSeekTimestamp }: LectureSideChatPanelProps) {
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
    return <LectureSideChatPanelEmptyState />;
  }

  return (
    <section className="rounded-3xl border border-[#d6e6f5] bg-white shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <LectureSideChatPanelHeaderSection highlightedLecture={highlightedLecture} statusText={statusText} />
      <LectureSideChatPanelBodySection
        highlightedLecture={highlightedLecture}
        messages={messages}
        input={input}
        sending={sending}
        quickPrompts={quickPrompts}
        onSeekTimestamp={onSeekTimestamp}
        onChangeInput={setInput}
        onSubmit={() => void handleSubmit()}
        onQuickPrompt={(prompt) => {
          setInput(prompt);
          void handleSubmit(prompt);
        }}
      />
    </section>
  );
}
