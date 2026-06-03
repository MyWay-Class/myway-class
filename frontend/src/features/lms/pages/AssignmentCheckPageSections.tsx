import type { CourseCard } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';

export type ReviewStatus = 'all' | 'pending' | 'reviewed' | 'flagged';

export type AssignmentItem = {
  id: string;
  course: CourseCard;
  title: string;
  status: Exclude<ReviewStatus, 'all'>;
  score: number;
  submittedAt: string;
  feedback: string;
};

export const statusMeta: Record<Exclude<ReviewStatus, 'all'>, { label: string; icon: string; tone: string }> = {
  pending: { label: '검토 대기', icon: 'ri-time-line', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: '검토 완료', icon: 'ri-check-double-line', tone: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  flagged: { label: '보완 필요', icon: 'ri-alert-line', tone: 'bg-rose-50 text-rose-600 border-rose-200' },
};

type AssignmentCheckPageSectionsProps = {
  stats: {
    total: number;
    pending: number;
    reviewed: number;
    flagged: number;
    averageScore: number;
  };
  reviewStatus: ReviewStatus;
  searchQuery: string;
  filteredAssignments: AssignmentItem[];
  onReviewStatusChange: (status: ReviewStatus) => void;
  onSearchQueryChange: (query: string) => void;
};

export function AssignmentCheckPageSections({
  stats,
  reviewStatus,
  searchQuery,
  filteredAssignments,
  onReviewStatusChange,
  onSearchQueryChange,
}: AssignmentCheckPageSectionsProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)] lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <i className="ri-file-check-line" />
              과제 검사
            </div>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
              제출 상태, 점수,
              <br />
              피드백을 한 번에 정리합니다.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
              검토 대기, 완료, 보완 필요를 색으로 나눠 빠르게 확인하고, 바로 다음 액션으로 이어갈 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">검토 대기</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{stats.pending}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">검토 완료</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{stats.reviewed}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">보완 필요</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{stats.flagged}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">평균 점수</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{stats.averageScore}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="과제명, 강의명, 강사명, 피드백 검색"
              className="h-11 w-full rounded-2xl border border-[#cce0f2] bg-[#f4faff] px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-[#7e94ad] focus:border-cyan-400"
            />
          </label>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {[
              { key: 'all', label: '전체' },
              { key: 'pending', label: '검토 대기' },
              { key: 'reviewed', label: '검토 완료' },
              { key: 'flagged', label: '보완 필요' },
            ].map((item) => {
              const active = reviewStatus === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onReviewStatusChange(item.key as ReviewStatus)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    active
                      ? 'bg-[linear-gradient(135deg,#00b8e6_0%,#0077b6_100%)] text-white'
                      : 'border border-[#cce0f2] bg-white text-[#4a6885] hover:border-cyan-300 hover:text-cyan-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#d6e6f5] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">과제 목록</h3>
            <p className="mt-1 text-[12px] text-slate-500">상태별 아이콘과 점수, 제출 시점을 함께 확인합니다.</p>
          </div>
          <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">검색 결과 {filteredAssignments.length}개</div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((item) => {
              const meta = statusMeta[item.status];
              return (
                <article key={item.id} className="rounded-[26px] border border-[#dce9f7] bg-[#f4faff] px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${meta.tone} bg-white text-[20px]`}>
                      <i className={meta.icon} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[14px] font-bold text-slate-900">{item.title}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-500">
                        {item.course.category} · {item.course.instructor_name} · {item.course.lecture_count}차시
                      </div>
                      <p className="mt-2 text-[12px] leading-6 text-slate-500">{item.feedback}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:w-[240px] lg:grid-cols-1">
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] text-slate-400">점수</div>
                        <div className="mt-1 text-[18px] font-extrabold text-slate-900">{item.score}</div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3">
                        <div className="text-[11px] text-slate-400">제출 시점</div>
                        <div className="mt-1 text-[13px] font-semibold text-slate-900">{item.submittedAt}</div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <StatePanel
              compact
              icon="ri-search-line"
              tone="slate"
              title="조건에 맞는 과제가 없습니다."
              description="검색어와 상태 필터를 바꾸면 다른 과제를 다시 찾을 수 있습니다."
            />
          )}
        </div>
      </section>
    </div>
  );
}
