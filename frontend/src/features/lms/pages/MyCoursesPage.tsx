import type { CourseCard, CourseDetail, LoginResponse } from '@myway/shared';
import { MyCoursesHero, MyCoursesList, MyCoursesPrimaryPreview, MyCoursesStats, MyCoursesToolbar } from './MyCoursesPageSections';
import { useMyCoursesDerived } from './useMyCoursesDerived';
import { useMyCoursesWorkspace } from './useMyCoursesWorkspace';

type MyCoursesPageProps = {
  session: LoginResponse;
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: 'my-courses' | 'course-create' | 'lecture-studio' | 'courses' | 'lecture-watch' | 'dashboard') => void;
};

export function MyCoursesPage({ session, courses, selectedCourse, onSelectCourse, onNavigate }: MyCoursesPageProps) {
  const {
    managedCourses,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortMode,
    setSortMode,
    viewMode,
    setViewMode,
    activeCategory,
    setActiveCategory,
    notice,
  } = useMyCoursesWorkspace({ session });

  const { primaryCourse, categories, primaryCourseTags, filteredCourses, stats } = useMyCoursesDerived(
    session,
    courses,
    managedCourses,
    selectedCourse,
    searchQuery,
    statusFilter,
    sortMode,
    activeCategory,
  );

  const totalLabel = session.user.role === 'STUDENT' ? '수강 중 강의 수' : '관리 강의 수';
  const publishedLabel = session.user.role === 'STUDENT' ? '완료 강의' : '공개 강의';

  return (
    <div className="space-y-6">
      <MyCoursesHero session={session} notice={notice} stats={{ inProgress: stats.inProgress, totalLectures: stats.totalLectures }} />
      <MyCoursesStats stats={stats} totalLabel={totalLabel} publishedLabel={publishedLabel} />
      <MyCoursesToolbar
        session={session}
        notice={notice}
        onNavigate={onNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        sortMode={sortMode}
        setSortMode={setSortMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resultCount={filteredCourses.length}
      />
      <MyCoursesPrimaryPreview
        primaryCourse={primaryCourse}
        primaryCourseTags={primaryCourseTags}
        session={session}
        onSelectCourse={onSelectCourse}
        onNavigate={onNavigate}
      />
      <MyCoursesList
        loading={loading}
        filteredCourses={filteredCourses}
        viewMode={viewMode}
        selectedCourse={selectedCourse}
        onSelectCourse={onSelectCourse}
        onNavigate={onNavigate}
      />
    </div>
  );
}
