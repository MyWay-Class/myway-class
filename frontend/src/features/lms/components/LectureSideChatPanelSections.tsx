import type { LectureDetail } from '@myway/shared';
import { StatePanel } from './StatePanel';
import { AIChatComposer } from './AIChatComposer';
import { AIChatThread, type AIChatMessage } from './AIChatThread';

type LectureSideChatPanelHeaderSectionProps = {
  highlightedLecture: LectureDetail;
  statusText: string;
};

type LectureSideChatPanelBodySectionProps = {
  highlightedLecture: LectureDetail;
  messages: AIChatMessage[];
  input: string;
  sending: boolean;
  quickPrompts: string[];
  onSeekTimestamp?: (startMs: number, lectureId?: string | null) => void;
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
  onQuickPrompt: (prompt: string) => void;
};

export function LectureSideChatPanelEmptyState() {
  return (
    <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
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

export function LectureSideChatPanelHeaderSection({ highlightedLecture, statusText }: LectureSideChatPanelHeaderSectionProps) {
  return (
    <div className="border-b border-[#dce9f7] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-cyan-700">강의 시청 챗봇</div>
          <h3 className="mt-1 text-[15px] font-bold text-slate-900">우측 사이드 질문</h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">{statusText}</p>
        </div>
        <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
          {highlightedLecture.week_number ?? 1}주차 · {highlightedLecture.session_number ?? highlightedLecture.order_index + 1}차시
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-[12px] text-[#355777]">
        <div className="flex items-center gap-2 font-semibold text-cyan-700">
          <i className="ri-lightbulb-flash-line" />
          지금 강의에 바로 물어보기
        </div>
        <div>스크립트 탭에서 타임스탬프를 확인한 뒤, 해당 구간의 개념이나 예시를 챗봇에 이어서 질문할 수 있습니다.</div>
      </div>
    </div>
  );
}

export function LectureSideChatPanelBodySection({
  highlightedLecture,
  messages,
  input,
  sending,
  quickPrompts,
  onSeekTimestamp,
  onChangeInput,
  onSubmit,
  onQuickPrompt,
}: LectureSideChatPanelBodySectionProps) {
  return (
    <>
      <div className="px-5 py-5">
        <div className="space-y-4 rounded-3xl border border-[#dce9f7] bg-[#f4faff] px-4 py-4">
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

          <AIChatThread messages={messages} loading={sending} onSeekTimestamp={onSeekTimestamp} />
        </div>
      </div>

      <AIChatComposer
        value={input}
        onChange={onChangeInput}
        onSubmit={onSubmit}
        quickPrompts={quickPrompts}
        onQuickPrompt={onQuickPrompt}
        disabled={sending}
      />
    </>
  );
}
