import type { AssignmentItem, ReviewStatus } from './AssignmentCheckPageSections';
import { StatePanel } from '../components/StatePanel';
import { statusMeta } from './AssignmentCheckPageSections';

type AssignmentCheckPageListProps = {
  filteredAssignments: AssignmentItem[];
  reviewStatus: ReviewStatus;
  searchQuery: string;
};

export function AssignmentCheckPageList({ filteredAssignments }: AssignmentCheckPageListProps) {
  return (
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
  );
}
