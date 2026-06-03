import { useEffect, useMemo, useState } from 'react';
import type { AIRagResult, AIInsights, LectureDetail, SmartChatResult } from '@myway/shared';
import { loadAIRAGOverview } from '../../../lib/ai-rag';
import { sendSmartChatDetailed } from '../../../lib/api';
import { getAiErrorMessage, getPublicTestPolicyText, getQuotaStatusText } from '../../../lib/ai-access';
import { type AIChatMessage } from '../components/AIChatThread';
import { AIChatPageConversation, AIChatPageHero } from './AIChatPageSections';

type AIChatPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
  selectedCourse?: { enrolled: boolean } | null;
  canManageCurrent?: boolean;
  sessionToken?: string | null;
};

function createWelcomeMessage(highlightedLecture: LectureDetail | null): AIChatMessage {
  return {
    id: `welcome-${highlightedLecture?.id ?? 'general'}`,
    role: 'assistant',
    content: highlightedLecture
      ? `${highlightedLecture.title} 기준으로 질문을 이어갈 수 있습니다. 핵심 개념, 요약, 퀴즈 중 하나로 시작해보세요.`
      : '강의를 선택하면 더 정확한 질문과 답변을 받을 수 있습니다.',
    suggestions: ['핵심 개념 요약', '시험 대비 문제', '숏폼으로 복습', '이전 강의와 연결'],
  };
}

function mapSmartChatResult(result: SmartChatResult): AIChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: result.answer,
    references: result.references,
    suggestions: result.suggestions,
    intent: result.intent,
  };
}

export function AIChatPage({ highlightedLecture, insights, selectedCourse, canManageCurrent, sessionToken }: AIChatPageProps) {
  const [ragOverview, setRagOverview] = useState<AIRagResult | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>(() => [createWelcomeMessage(null)]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('공개 테스트 안내');
  const [bannerDescription, setBannerDescription] = useState(getPublicTestPolicyText('chat'));
  const [bannerMeta, setBannerMeta] = useState<string | null>(null);
  const isLocked = Boolean(selectedCourse && !selectedCourse.enrolled && !canManageCurrent);

  useEffect(() => {
    setMessages([createWelcomeMessage(highlightedLecture)]);
    setSidebarOpen(false);
  }, [highlightedLecture?.id, highlightedLecture?.title]);

  useEffect(() => {
    let alive = true;
    setBannerTitle('공개 테스트 안내');
    setBannerDescription(getPublicTestPolicyText('chat'));
    setBannerMeta(null);

    if (isLocked || !highlightedLecture) {
      setRagOverview(null);
      setRagLoading(false);
      return undefined;
    }

    setRagLoading(true);
    loadAIRAGOverview({
      query: `${highlightedLecture.title}의 핵심을 근거와 함께 정리해줘`,
      lecture_id: highlightedLecture.id,
      limit: 4,
    })
      .then((result) => {
        if (alive) {
          setRagOverview(result);
        }
      })
      .finally(() => {
        if (alive) {
          setRagLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [highlightedLecture?.id, highlightedLecture?.title, isLocked]);

  const quickPrompts = useMemo(
    () => ['핵심 개념 요약', '시험 대비 문제', '이전 강의와 연결', '숏폼으로 복습'],
    [],
  );

  async function handleSubmit(messageText = input) {
    const message = messageText.trim();
    if (!message || sending) {
      return;
    }

    setInput('');
    setSending(true);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
      },
    ]);

    try {
      const result = await sendSmartChatDetailed(
        {
          message,
          lecture_id: highlightedLecture?.id ?? undefined,
          course_id: undefined,
          context: highlightedLecture ? [highlightedLecture.title] : undefined,
        },
        sessionToken,
      );

      if (result?.success && result.data) {
        setBannerTitle('AI 요청 상태');
        setBannerDescription('요청이 정상 처리되었습니다. 남은 사용량은 화면 우측 배너에서 확인할 수 있습니다.');
        setBannerMeta(getQuotaStatusText(result) ?? '사용량 정보 없음');
      } else {
        setBannerTitle('요청 제한 안내');
        setBannerDescription(getAiErrorMessage(result, 'AI 채팅을 처리할 수 없습니다.'));
        setBannerMeta(getQuotaStatusText(result));
      }

      setMessages((current) => [
        ...current,
        result && result.success && result.data
          ? mapSmartChatResult(result.data)
          : {
              id: `fallback-${Date.now()}`,
              role: 'assistant',
              content: highlightedLecture
                ? `${highlightedLecture.title} 기준으로 정리하면 핵심 개념부터 요약해볼 수 있습니다.`
                : '질문을 다시 입력해보세요.',
              suggestions: quickPrompts,
            },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <AIChatPageHero
        highlightedLecture={highlightedLecture}
        isLocked={isLocked}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
      />

      <AIChatPageConversation
        highlightedLecture={highlightedLecture}
        insights={insights}
        isLocked={isLocked}
        messages={messages}
        sending={sending}
        input={input}
        bannerTitle={bannerTitle}
        bannerDescription={bannerDescription}
        bannerMeta={bannerMeta}
        ragOverview={ragOverview}
        ragLoading={ragLoading}
        sidebarOpen={sidebarOpen}
        quickPrompts={quickPrompts}
        onChangeInput={setInput}
        onSubmit={() => void handleSubmit()}
        onQuickPrompt={(prompt) => {
          setInput(prompt);
          void handleSubmit(prompt);
        }}
        onCloseSidebar={() => setSidebarOpen(false)}
      />
    </div>
  );
}
