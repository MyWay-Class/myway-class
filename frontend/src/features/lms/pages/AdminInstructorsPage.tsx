import { useState } from 'react';
import type { AuthUser, CourseCard } from '@myway/shared';
import { AdminFilterBar } from '../components/AdminFilterBar';
import { demoCourses, demoUsers } from '../data/demo';

type AdminInstructorsPageProps = {
  instructors: AuthUser[];
  courses: CourseCard[];
};

export function AdminInstructorsPage({ instructors, courses }: AdminInstructorsPageProps) {
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sortValue, setSortValue] = useState<'name' | 'course-count' | 'department'>('course-count');
  const visibleInstructors = instructors.length > 0 ? instructors : demoUsers.filter((user) => user.role === 'INSTRUCTOR');
  const visibleCourses = courses.length > 0 ? courses : demoCourses;

  const departments = Array.from(new Set(visibleInstructors.map((instructor) => instructor.department))).sort((left, right) =>
    left.localeCompare(right),
  );
  const departmentOptions = [{ value: 'ALL', label: '전체' }, ...departments.map((department) => ({ value: department, label: department }))];

  const filteredInstructors = visibleInstructors
    .filter((instructor) => {
      const searchable = [instructor.name, instructor.email, instructor.department].join(' ').toLowerCase();
      const queryMatch = query.trim() ? searchable.includes(query.trim().toLowerCase()) : true;
      const departmentMatch = departmentFilter === 'ALL' ? true : instructor.department === departmentFilter;
      return queryMatch && departmentMatch;
    })
    .sort((left, right) => {
      const leftCourseCount = visibleCourses.filter((course) => course.instructor_name === left.name).length;
      const rightCourseCount = visibleCourses.filter((course) => course.instructor_name === right.name).length;

      if (sortValue === 'name') {
        return left.name.localeCompare(right.name);
      }

      if (sortValue === 'department') {
        return left.department.localeCompare(right.department) || left.name.localeCompare(right.name);
      }

      return rightCourseCount - leftCourseCount || left.name.localeCompare(right.name);
    });

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
          <i className="ri-user-star-line" />
          강사 운영
        </div>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">강사 운영 상세</h2>
        <p className="mt-1 text-[13px] text-slate-600">강사별 담당 과목과 소속을 빠르게 비교해 운영 우선순위를 조정합니다.</p>
      </section>
      <AdminFilterBar
        title="강사 관리"
        subtitle="담당 과목, 소속, 이름을 기준으로 찾아보고 운영 우선순위가 높은 강사를 빠르게 확인합니다."
        query={query}
        onQueryChange={setQuery}
        queryPlaceholder="강사 이름, 이메일, 소속 검색"
        sortLabel="정렬"
        sortValue={sortValue}
        onSortChange={(value) => setSortValue(value as typeof sortValue)}
        sortOptions={[
          { value: 'course-count', label: '담당 과목 많은 순' },
          { value: 'name', label: '이름순' },
          { value: 'department', label: '소속순' },
        ]}
        chips={departmentOptions.map((option) => ({
          label: option.label,
          active: departmentFilter === option.value,
          onSelect: () => setDepartmentFilter(option.value),
        }))}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredInstructors.length > 0 ? (
          filteredInstructors.map((instructor) => {
            const ownCourses = visibleCourses.filter((course) => course.instructor_name === instructor.name);
            const averageProgress = ownCourses.length > 0 ? Math.round(ownCourses.reduce((sum, course) => sum + course.progress_percent, 0) / ownCourses.length) : 0;
            return (
              <article key={instructor.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-[16px] font-bold text-cyan-700">
                    {instructor.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-slate-900">{instructor.name}</div>
                    <div className="mt-1 text-[12px] text-slate-500">
                      {instructor.email} · {instructor.department}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ownCourses.length ? (
                        ownCourses.map((course) => (
                          <span key={course.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {course.title}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">배정 과목 없음</span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[10px] font-semibold text-slate-400">담당 과목</div>
                        <div className="mt-1 text-[13px] font-bold text-slate-900">{ownCourses.length}개</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[10px] font-semibold text-slate-400">평균 진도</div>
                        <div className="mt-1 text-[13px] font-bold text-slate-900">{averageProgress}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-[13px] leading-6 text-slate-500 xl:col-span-2">
            조건에 맞는 강사가 없습니다. 검색어나 소속 필터를 바꿔보세요.
          </article>
        )}
      </div>
    </div>
  );
}
