import { useMemo, useRef, useState } from 'react';
import type { CourseCard } from '@myway/shared';

type PublicHomePageStateArgs = {
  courseCards: CourseCard[];
};

function countUnique(values: string[]): number {
  return new Set(values).size;
}

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function usePublicHomePageState({ courseCards }: PublicHomePageStateArgs) {
  const coursesRef = useRef<HTMLElement | null>(null);
  const roadmapRef = useRef<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | 'available' | 'enrolled'>('all');

  const categories = useMemo(() => [...new Set(courseCards.map((item) => item.category))], [courseCards]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return courseCards.filter((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      const queryMatch = query
        ? [course.title, course.description, course.category, course.instructor_name, ...tags].join(' ').toLowerCase().includes(query)
        : true;
      const categoryMatch = activeCategory ? course.category === activeCategory : true;
      const statusMatch =
        activeStatus === 'all'
          ? true
          : activeStatus === 'available'
            ? !course.enrolled
            : course.enrolled;

      return queryMatch && categoryMatch && statusMatch;
    });
  }, [activeCategory, activeStatus, courseCards, searchQuery]);

  const featuredCourses = filteredCourses.slice(0, 5);
  const featuredTags = useMemo(() => {
    const counts = new Map<string, number>();

    courseCards.forEach((course) => {
      const tags = Array.isArray(course.tags) ? course.tags : [];
      tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [courseCards]);

  const totalProgress = Math.round(
    courseCards.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courseCards.length, 1),
  );
  const tagCount = countUnique(courseCards.flatMap((course) => (Array.isArray(course.tags) ? course.tags : [])));

  return {
    coursesRef,
    roadmapRef,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    activeStatus,
    setActiveStatus,
    categories,
    filteredCourses,
    featuredCourses,
    featuredTags,
    totalProgress,
    tagCount,
    scrollToCourses: () => scrollToElement(coursesRef.current),
    scrollToRoadmap: () => scrollToElement(roadmapRef.current),
  };
}
