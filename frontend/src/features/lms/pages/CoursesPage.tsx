import { useEffect, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseExploreCard } from '../components/CourseExploreCard';
import { CourseExploreDetailPanel } from '../components/CourseExploreDetailPanel';
import { CourseExploreFilters } from '../components/CourseExploreFilters';
import { CourseExploreHero } from '../components/CourseExploreHero';
import type { LmsPageId } from '../types';

type CoursesPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  busy: boolean;
  sessionToken?: string | null;
  onEnroll: (courseId: string) => void;
  onCreateCourse: (input: import('@myway/shared').CourseCreateRequest) => Promise<import('@myway/shared').CourseDetail | null>;
  onNavigate: (page: LmsPageId) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
};

type CourseTab = '강의' | '공지' | '자료';
type ExploreStatusTab = 'all' | 'available' | 'enrolled';

function getFeaturedTags(courses: CourseCard[]): string[] {
  const counts = new Map<string, number>();

  courses.forEach((course) => {
    course.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([tag]) => tag);
}

export function CoursesPage({
  courses,
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onEnroll,
  onNavigate,
  onSelectCourse,
  onSelectLecture,
}: CoursesPageProps) {
  const [activeTab, setActiveTab] = useState<CourseTab>('강의');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState<ExploreStatusTab>('all');
  const course = selectedCourse;
  const detailLecture = highlightedLecture;

  useEffect(() => {
    setActiveTab('강의');
  }, [course?.id]);

  const categories = [...new Set(courses.map((item) => item.category))];
  const filteredCourses = courses.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    const queryMatch = query
      ? [item.title, item.description, item.category, item.instructor_name, ...item.tags].join(' ').toLowerCase().includes(query)
      : true;
    const categoryMatch = activeCategory ? item.category === activeCategory : true;
    const statusMatch =
      activeStatus === 'all'
        ? true
        : activeStatus === 'available'
          ? !item.enrolled
          : item.enrolled;

    return queryMatch && categoryMatch && statusMatch;
  });

  return (
    <div className="space-y-5">
      <CourseExploreHero
        totalCourses={courses.length}
        enrolledCourses={courses.filter((item) => item.enrolled).length}
        availableCourses={courses.filter((item) => !item.enrolled).length}
        categoryCount={categories.length}
        tagCount={new Set(courses.flatMap((item) => item.tags)).size}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        featuredTags={getFeaturedTags(courses)}
      />

      {canManageCurrent ? (
        <section className="rounded-3xl border border-indigo-100 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                <i className="ri-add-circle-line" />
                강의 개설 바로가기
              </div>
              <h3 className="mt-3 text-[16px] font-extrabold tracking-[-0.03em] text-slate-900">새 강의와 내 강의 관리를 전용 페이지에서 바로 열 수 있습니다.</h3>
              <p className="mt-2 text-[12px] leading-6 text-slate-500">
                교수, 강사, 운영자 권한은 강의 목록에서 바로 개설 페이지나 관리 페이지로 이동해 필요한 작업을 이어가면 됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate('my-courses')}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                내 강의 관리
              </button>
              <button
                type="button"
                onClick={() => onNavigate('course-create')}
                className="rounded-full bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500"
              >
                강의 개설 페이지 열기
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <CourseExploreFilters
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        resultCount={filteredCourses.length}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">강의 목록</h3>
            <p className="mt-1 text-[12px] text-slate-500">검색과 필터로 좁힌 강의만 보여주고, 선택하면 아래 상세로 이어집니다.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {filteredCourses.length}개
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((item) => (
              <CourseExploreCard key={item.id} course={item} selected={selectedCourse?.id === item.id} onSelect={onSelectCourse} />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[26px] text-slate-400 shadow-sm">
                    <i className="ri-search-line" />
                  </div>
                  <h3 className="mt-4 text-center text-[16px] font-bold text-slate-900">검색 결과가 없습니다.</h3>
                  <p className="mx-auto mt-2 max-w-md text-center text-[13px] leading-6 text-slate-500">
                    검색어, 카테고리, 수강 상태를 조금 바꾸면 원하는 강의를 다시 찾을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">선택한 강의 작업 공간</h3>
              <p className="mt-1 text-[12px] text-slate-500">
                강의 상세, 영상 시청, 우측 챗봇, 숏폼 만들기를 한 곳에 모아두었습니다.
              </p>
            </div>
            {course ? (
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                현재 선택: {course.title}
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <CourseExploreDetailPanel
              course={course}
              highlightedLecture={detailLecture}
              selectedLectureId={selectedLectureId}
              viewMode="detail"
              activeTab={activeTab}
              canManageCurrent={canManageCurrent}
              sessionToken={sessionToken}
              onSelectLecture={onSelectLecture}
              onEnroll={onEnroll}
              onTabChange={setActiveTab}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
