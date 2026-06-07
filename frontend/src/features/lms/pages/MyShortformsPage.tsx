import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, CustomCourseLibraryItem, ShortformLibraryItem } from '@myway/shared';
import {
  MyShortformsControls,
  MyShortformsHero,
  MyShortformsList,
  MyShortformsMetrics,
} from './MyShortformsPageSections';
import { useMyShortformsPageActions } from './useMyShortformsPageActions';

type MyShortformsPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  sessionToken: string | null;
};

type LibraryTab = 'videos' | 'courses';

export function MyShortformsPage({ courses, selectedCourse, sessionToken }: MyShortformsPageProps) {
  const [customCourses, setCustomCourses] = useState<CustomCourseLibraryItem[]>([]);
  const [shortformLibrary, setShortformLibrary] = useState<ShortformLibraryItem[]>([]);
  const [status, setStatus] = useState('라이브러리를 불러오는 중입니다.');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LibraryTab>('videos');

  const {
    refreshLibrary,
    handleShareCourse,
    handleCopyCourse,
    handleShareShortform,
    handleSaveShortform,
    handleLikeShortform,
    handleRetryExport,
  } = useMyShortformsPageActions({
    sessionToken,
    setCustomCourses,
    setShortformLibrary,
    setStatus,
  });

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const copiedCourses = customCourses.filter((course) => course.ownership === 'copied');
  const ownedVideos = shortformLibrary.filter((video) => video.ownership === 'owned');
  const savedVideos = shortformLibrary.filter((video) => video.ownership === 'saved');

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customCourses.filter((course) => {
      if (!q) return true;
      return [course.title, course.description, course.course_id].join(' ').toLowerCase().includes(q);
    });
  }, [customCourses, query]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shortformLibrary.filter((video) => {
      if (!q) return true;
      return [video.title, video.description, video.course_id].join(' ').toLowerCase().includes(q);
    });
  }, [shortformLibrary, query]);

  return (
    <div className="space-y-5">
      <MyShortformsHero
        selectedTitle={selectedCourse?.title ?? courses[0]?.title ?? '전체 강의'}
        ownedVideosCount={ownedVideos.length}
        savedVideosCount={savedVideos.length}
        customCoursesCount={customCourses.length}
      />

      <MyShortformsControls query={query} onQueryChange={setQuery} tab={tab} onTabChange={setTab} status={status} />

      <MyShortformsMetrics
        customCoursesCount={customCourses.length}
        ownedVideosCount={ownedVideos.length}
        savedVideosCount={savedVideos.length}
        copiedCoursesCount={copiedCourses.length}
      />

      <MyShortformsList
        tab={tab}
        filteredVideos={filteredVideos}
        filteredCourses={filteredCourses}
        onSaveShortform={handleSaveShortform}
        onLikeShortform={handleLikeShortform}
        onShareShortform={handleShareShortform}
        onRetryExport={handleRetryExport}
        onShareCourse={handleShareCourse}
        onCopyCourse={handleCopyCourse}
      />
    </div>
  );
}
