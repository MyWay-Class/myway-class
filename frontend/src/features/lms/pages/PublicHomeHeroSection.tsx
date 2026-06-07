import type { RefObject } from 'react';

type PublicHomeHeroSectionProps = {
  coursesRef: RefObject<HTMLElement | null>;
  roadmapRef: RefObject<HTMLElement | null>;
  totalProgress: number;
  courseCount: number;
  featuredTags: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onTagClick: (value: string) => void;
  onOpenLogin: () => void;
};

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function PublicHomeHeroSection({
  coursesRef,
  roadmapRef,
  totalProgress,
  courseCount,
  featuredTags,
  searchQuery,
  onSearchQueryChange,
  onTagClick,
  onOpenLogin,
}: PublicHomeHeroSectionProps) {
  return (
    <>
      <section className="overflow-hidden rounded-[26px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.26),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(15,118,110,0.34),transparent_42%),linear-gradient(125deg,#05213f_0%,#0c365f_56%,#115078_100%)] p-6 text-white shadow-[0_24px_58px_rgba(10,30,64,0.36)] lg:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-[40px] font-black tracking-[-0.04em] lg:text-[56px]">AI로 배우고,<br />성장하는 실력</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-cyan-50/90">
              2026년, 당신의 커리어를 바꿀 가장 확실한 선택. 로그인 전에도 인기 강의와 AI 추천 흐름을 먼저 경험해보세요.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => scrollToElement(coursesRef.current)} className="rounded-xl bg-cyan-300 px-5 py-2.5 text-[13px] font-bold text-cyan-950 hover:bg-cyan-200">
                강의 탐색 시작
              </button>
              <button type="button" onClick={onOpenLogin} className="rounded-xl border border-cyan-100/30 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-cyan-50 hover:bg-white/20">
                로그인 후 계속
              </button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="absolute inset-0 rounded-[30px] bg-cyan-300/20 blur-2xl" />
            <div className="relative rounded-[30px] border border-cyan-100/25 bg-white/10 p-5 backdrop-blur">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[24px] border border-cyan-200/35 bg-gradient-to-br from-cyan-200/95 to-cyan-400/75 text-[46px] font-black text-slate-900">AI</div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-cyan-50">
                <div className="rounded-2xl border border-cyan-100/20 bg-slate-900/35 px-3 py-2">
                  <div className="text-[11px] text-cyan-100/80">평균 진도</div>
                  <div className="mt-1 text-[18px] font-extrabold">{totalProgress}%</div>
                </div>
                <div className="rounded-2xl border border-cyan-100/20 bg-slate-900/35 px-3 py-2">
                  <div className="text-[11px] text-cyan-100/80">강의 수</div>
                  <div className="mt-1 text-[18px] font-extrabold">{courseCount}개</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={roadmapRef} className="rounded-[22px] border border-cyan-200/20 bg-[linear-gradient(145deg,#0a2f56_0%,#0b3c63_45%,#11496f_100%)] p-5 text-cyan-50 shadow-[0_14px_36px_rgba(8,47,73,0.35)] lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-[-0.02em]">원하는 강의를 찾아보세요</h2>
            <div className="mt-4 flex items-center rounded-2xl border border-cyan-100/30 bg-white/95 px-4 py-3 text-slate-700">
              <i className="ri-search-line text-[18px] text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="강의명, 키워드, 스킬 등을 검색해보세요"
                className="ml-3 w-full bg-transparent text-[14px] outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(featuredTags.length > 0 ? featuredTags : ['프롬프트 엔지니어링', 'ChatGPT 활용', '파이썬']).map((tag) => (
                <button key={tag} type="button" onClick={() => onTagClick(tag)} className="rounded-full border border-cyan-100/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-50/95 hover:bg-white/20">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-4 backdrop-blur">
            <div className="text-[12px] font-semibold text-cyan-100/85">AI 맞춤 추천</div>
            <div className="mt-2 text-[15px] font-bold text-white">학습 목표 기반 코스 추천</div>
            <p className="mt-1 text-[12px] leading-6 text-cyan-100/80">로그인하면 강의 상세, 챗봇 학습, 숏폼 복습까지 한번에 연결됩니다.</p>
            <button type="button" onClick={onOpenLogin} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-cyan-200/35 bg-cyan-300/20 px-3 py-1.5 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-300/30">
              로그인 후 추천 보기
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
