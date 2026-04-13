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
            return (
              <article key={instructor.id} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-[16px] font-bold text-violet-600">
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
