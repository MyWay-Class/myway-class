import type { LectureDetail } from '@myway/shared';
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
