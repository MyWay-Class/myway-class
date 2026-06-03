import type { AIInsights, AIRagResult, LectureDetail } from '@myway/shared';
import { AIChatComposer } from '../components/AIChatComposer';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { AIChatSidebar } from '../components/AIChatSidebar';
import { AIChatThread, type AIChatMessage } from '../components/AIChatThread';
import { StatePanel } from '../components/StatePanel';

type AIChatPageHeroProps = {
  highlightedLecture: LectureDetail | null;
  isLocked: boolean;
  onToggleSidebar: () => void;
};

export function AIChatPageHero({ highlightedLecture, isLocked, onToggleSidebar }: AIChatPageHeroProps) {
  return (
    <>
      {isLocked ? (
        <StatePanel
          icon="ri-lock-line"
          tone="amber"
          title="수강 신청 후 AI 챗봇을 사용할 수 있습니다."
          description="강의 내용 검색과 질문 응답은 수강 신청한 강의에서만 열립니다."
        />
      ) : null}

      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#03162a_0%,#004e7d_42%,#00a7c8_100%)] px-6 py-7 text-white shadow-[0_30px_70px_rgba(5,44,74,0.25)] lg:px-8">
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
            onClick={onToggleSidebar}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white lg:hidden"
          >
            <i className="ri-layout-right-line mr-1" />
            도우미 패널
          </button>
        </div>
      </section>
    </>
  );
}

type AIChatPageConversationProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
  isLocked: boolean;
  messages: AIChatMessage[];
  sending: boolean;
  input: string;
  bannerTitle: string;
  bannerDescription: string;
  bannerMeta: string | null;
  ragOverview: AIRagResult | null;
  ragLoading: boolean;
  sidebarOpen: boolean;
  quickPrompts: string[];
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
  onQuickPrompt: (prompt: string) => void;
  onCloseSidebar: () => void;
};

export function AIChatPageConversation({
  highlightedLecture,
  insights,
  isLocked,
  messages,
  sending,
  input,
  bannerTitle,
  bannerDescription,
  bannerMeta,
  ragOverview,
  ragLoading,
  sidebarOpen,
  quickPrompts,
  onChangeInput,
  onSubmit,
  onQuickPrompt,
  onCloseSidebar,
}: AIChatPageConversationProps) {
  return (
    <>
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
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
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
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                      {ragOverview.provider.search_provider}
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-[var(--app-text-secondary)]">{ragOverview.answer.answer}</p>
                </div>
              ) : null}
            </div>

            <AIChatComposer
              value={input}
              onChange={onChangeInput}
              onSubmit={onSubmit}
              quickPrompts={quickPrompts}
              onQuickPrompt={onQuickPrompt}
              disabled={sending}
            />
          </section>

          <AIChatSidebar
            highlightedLecture={highlightedLecture}
            insights={insights}
            ragOverview={ragOverview}
            ragLoading={ragLoading}
            openOnMobile={sidebarOpen}
            onCloseMobile={onCloseSidebar}
          />
        </div>
      ) : null}
    </>
  );
}
