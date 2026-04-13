import { useEffect, useMemo, useState } from 'react';
import type { AIRagResult, AIInsights, LectureDetail, SmartChatResult } from '@myway/shared';
import { loadAIRAGOverview } from '../../../lib/ai-rag';
import { sendSmartChatDetailed } from '../../../lib/api';
import { getAiErrorMessage, getPublicTestPolicyText, getQuotaStatusText } from '../../../lib/ai-access';
import { AIChatComposer } from '../components/AIChatComposer';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { AIChatSidebar } from '../components/AIChatSidebar';
import { AIChatThread, type AIChatMessage } from '../components/AIChatThread';
import { StatePanel } from '../components/StatePanel';

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
      {isLocked ? (
        <StatePanel
          icon="ri-lock-line"
          tone="amber"
          title="수강 신청 후 AI 챗봇을 사용할 수 있습니다."
          description="강의 내용 검색과 질문 응답은 수강 신청한 강의에서만 열립니다."
        />
      ) : null}

      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#070b1b_0%,#1b2250_48%,#5b21b6_100%)] px-6 py-7 text-white shadow-[0_30px_70px_rgba(15,23,42,0.16)] lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">AI 학습 챗</span>
            <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.05em] lg:text-[32px]">질문에 맞는 답을 바로 받을 수 있는 챗봇 화면입니다.</h1>
            <p className="mt-2 text-[13px] leading-6 text-white/78">
              {isLocked
                ? '수강 신청 후에 강의 내용 검색과 질문을 이어갈 수 있습니다.'
                : highlightedLecture
                  ? `${highlightedLecture.title} 기준으로 질문을 이어갈 수 있습니다.`
                  : '강의 기반 질문과 복습을 위한 채팅 화면입니다.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white lg:hidden"
          >
            <i className="ri-layout-right-line mr-1" />
            도우미 패널
          </button>
        </div>
      </section>

      {!isLocked ? <AiNoticeBanner title={bannerTitle} description={bannerDescription} tone="indigo" meta={bannerMeta} /> : null}

      {!isLocked ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[30px] border border-[var(--app-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-surface-soft)] px-5 py-4">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--app-text)]">대화</h2>
              <p className="mt-1 text-[12px] text-[var(--app-text-muted)]">
                질문, 요약, 퀴즈, 복습 순서로 이어가면 레퍼런스처럼 흐름이 안정적입니다.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              {messages.length}개 메시지
            </span>
          </div>

          <div className="min-h-[400px] space-y-4 px-5 py-5">
            <AIChatThread messages={messages} loading={sending} />

            {ragOverview ? (
              <div className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--app-text-muted)]">RAG 파이프라인</div>
                    <div className="mt-1 text-[14px] font-bold text-[var(--app-text)]">{ragOverview.query}</div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                    {ragOverview.provider.search_provider}
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-[var(--app-text-secondary)]">{ragOverview.answer.answer}</p>
              </div>
            ) : null}
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

        <AIChatSidebar
          highlightedLecture={highlightedLecture}
          insights={insights}
          ragOverview={ragOverview}
          ragLoading={ragLoading}
          openOnMobile={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        </div>
      ) : null}
    </div>
  );
}
