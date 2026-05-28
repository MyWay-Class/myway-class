import { useMemo } from 'react';
import type { CourseCard, CourseDetail, LoginResponse } from '@myway/shared';
import { demoCourses } from '../data/demo';

export type ViewMode = 'grid' | 'list';
export type StatusFilter = 'all' | 'progress' | 'completed';
export type SortMode = 'progress' | 'title' | 'duration';

export function useMyCoursesDerived(
  session: LoginResponse,
  courses: CourseCard[],
  managedCourses: CourseCard[],
  selectedCourse: CourseDetail | null,
  searchQuery: string,
  statusFilter: StatusFilter,
  sortMode: SortMode,
  activeCategory: string,
) {
  const enrolledCourses = courses.filter((course) => course.enrolled);
  const instructorCourses = managedCourses.length > 0
    ? managedCourses
    : courses.filter((course) => session.user.role === 'ADMIN' || course.instructor_id === session.user.id);
  const currentCourses = session.user.role === 'STUDENT' ? enrolledCourses : instructorCourses;
  const visibleCourses = currentCourses.length > 0 ? currentCourses : demoCourses;
  const primaryCourse = selectedCourse ?? visibleCourses[0] ?? null;
  const categories = ['all', ...new Set(visibleCourses.map((course) => course.category))];
  const primaryCourseTags = Array.isArray(primaryCourse?.tags) ? primaryCourse.tags : [];

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return visibleCourses
      .filter((course) => {
        const queryMatch = query
          ? [course.title, course.category, course.description, course.instructor_name, ...course.tags].join(' ').toLowerCase().includes(query)
          : true;
        const categoryMatch = activeCategory === 'all' ? true : course.category === activeCategory;
        const statusMatch =
          statusFilter === 'all'
            ? true
            : statusFilter === 'progress'
              ? course.progress_percent > 0 && course.progress_percent < 100
              : course.progress_percent >= 100;

        return queryMatch && categoryMatch && statusMatch;
      })
      .sort((left, right) => {
        if (sortMode === 'title') return left.title.localeCompare(right.title);
        if (sortMode === 'duration') return right.total_duration_minutes - left.total_duration_minutes;
        return right.progress_percent - left.progress_percent;
      });
  }, [activeCategory, searchQuery, sortMode, statusFilter, visibleCourses]);

  const stats = useMemo(
    () => ({
      total: visibleCourses.length,
      published: visibleCourses.filter((course) => course.is_published).length,
      totalLectures: visibleCourses.reduce((sum, course) => sum + course.lecture_count, 0),
      inProgress: visibleCourses.filter((course) => course.progress_percent > 0 && course.progress_percent < 100).length,
    }),
    [visibleCourses],
  );

  return {
    visibleCourses,
    primaryCourse,
    categories,
    primaryCourseTags,
    filteredCourses,
    stats,
  };
}
