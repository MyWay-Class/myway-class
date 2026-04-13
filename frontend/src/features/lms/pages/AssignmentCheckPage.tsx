import { useMemo, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';

type AssignmentCheckPageProps = {
  courses: CourseCard[];
};

type ReviewStatus = 'all' | 'pending' | 'reviewed' | 'flagged';

type AssignmentItem = {
  id: string;
  course: CourseCard;
  title: string;
  status: Exclude<ReviewStatus, 'all'>;
  score: number;
  submittedAt: string;
  feedback: string;
};

const statusMeta: Record<Exclude<ReviewStatus, 'all'>, { label: string; icon: string; tone: string }> = {
  pending: { label: '검토 대기', icon: 'ri-time-line', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: '검토 완료', icon: 'ri-check-double-line', tone: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  flagged: { label: '보완 필요', icon: 'ri-alert-line', tone: 'bg-rose-50 text-rose-600 border-rose-200' },
};

function buildAssignments(courses: CourseCard[]): AssignmentItem[] {
  return courses.slice(0, 6).map((course, index) => {
    const status: AssignmentItem['status'] = index % 3 === 0 ? 'pending' : index % 3 === 1 ? 'reviewed' : 'flagged';
    return {
      id: `${course.id}-${index}`,
      course,
      title: `${course.title} 과제 ${index + 1}`,
      status,
      score: Math.min(95, Math.max(60, Math.round(course.progress_percent + 55 - index * 3))),
      submittedAt: `${index + 1}시간 전`,
      feedback:
        status === 'pending'
          ? '제출물을 열어 요약과 기준 충족 여부를 확인합니다.'
          : status === 'reviewed'
            ? '기본 항목이 충족되었습니다. 간단한 피드백만 남기면 됩니다.'
            : '참조 자료와 형식 정리가 조금 더 필요합니다.',
    };
  });
}

export function AssignmentCheckPage({ courses }: AssignmentCheckPageProps) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const assignments = useMemo(() => buildAssignments(courses), [courses]);
  const filteredAssignments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch = normalized
        ? [item.title, item.course.title, item.course.instructor_name, item.course.category, item.feedback].join(' ').toLowerCase().includes(normalized)
        : true;
      const matchesStatus = reviewStatus === 'all' ? true : item.status === reviewStatus;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, reviewStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: assignments.length,
      pending: assignments.filter((item) => item.status === 'pending').length,
      reviewed: assignments.filter((item) => item.status === 'reviewed').length,
      flagged: assignments.filter((item) => item.status === 'flagged').length,
      averageScore:
        assignments.length > 0 ? Math.round(assignments.reduce((sum, item) => sum + item.score, 0) / assignments.length) : 0,
    }),
    [assignments],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
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

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="과제명, 강의명, 강사명, 피드백 검색"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
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
                  onClick={() => setReviewStatus(item.key as ReviewStatus)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">과제 목록</h3>
            <p className="mt-1 text-[12px] text-slate-500">상태별 아이콘과 점수, 제출 시점을 함께 확인합니다.</p>
          </div>
          <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">검색 결과 {filteredAssignments.length}개</div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((item) => {
              const meta = statusMeta[item.status];
              return (
                <article key={item.id} className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-4">
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
