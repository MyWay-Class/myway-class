import { useEffect, useMemo } from 'react';
import type { CourseCard, ShortformCommunityItem } from '@myway/shared';

export type FeedFilter = 'all' | 'popular' | 'saved' | 'recent';

export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return remain > 0 ? `${minutes}분 ${remain}초` : `${minutes}분`;
}

export function shortformSummary(item: ShortformCommunityItem | null): string {
  if (!item) return '선택된 숏폼이 없습니다.';
  if (item.clips.length === 0) return '클립이 아직 준비되지 않았습니다.';
  return `${item.clips.length}개 클립 · ${formatDuration(item.duration_ms)} · ${item.view_count}회 조회`;
}

function rankItems(items: ShortformCommunityItem[], filter: FeedFilter, query: string): ShortformCommunityItem[] {
  const normalized = query.trim().toLowerCase();
  return [...items]
    .filter((item) => {
      const matchesQuery = normalized
        ? [item.title, item.description, item.course_title, item.shared_by_name, ...item.clips.map((clip) => clip.lecture_title)]
            .join(' ')
            .toLowerCase()
            .includes(normalized)
        : true;

      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'popular'
            ? item.like_count >= 10
            : filter === 'saved'
              ? item.is_saved
              : true;

      return matchesQuery && matchesFilter;
    })
    .sort((left, right) => {
      if (filter === 'recent') return right.updated_at.localeCompare(left.updated_at);
      return right.view_count + right.like_count - (left.view_count + left.like_count);
    });
}

export function useCommunityDerived(
  courses: CourseCard[],
  community: ShortformCommunityItem[],
  filter: FeedFilter,
  query: string,
  activeItemId: string | null,
  setActiveItemId: (id: string | null | ((current: string | null) => string | null)) => void,
  setDetailTab: (tab: 'video' | 'clips' | 'info') => void,
) {
  const enrolledCourses = useMemo(() => courses.filter((course) => course.enrolled), [courses]);
  const items = useMemo(() => rankItems(community, filter, query), [community, filter, query]);

  useEffect(() => {
    if (items.length === 0) {
      setActiveItemId(null);
      setDetailTab('video');
      return;
    }
    const isActiveVisible = items.some((item) => item.id === activeItemId);
    if (!isActiveVisible) {
      setActiveItemId(items[0].id);
      setDetailTab('video');
    }
  }, [activeItemId, items, setActiveItemId, setDetailTab]);

  const selectedItem = items.find((item) => item.id === activeItemId) ?? items[0] ?? null;
  const totalClips = items.reduce((sum, item) => sum + item.clips.length, 0);
  const totalViews = items.reduce((sum, item) => sum + item.view_count, 0);
  const totalLikes = items.reduce((sum, item) => sum + item.like_count, 0);
  const selectedClipCount = selectedItem?.clips.length ?? 0;
  const hasEnrolledCourses = enrolledCourses.length > 0;
  const hasRealFeed = items.length > 0;

  return {
    enrolledCourses,
    items,
    selectedItem,
    totalClips,
    totalViews,
    totalLikes,
    selectedClipCount,
    hasEnrolledCourses,
    hasRealFeed,
  };
}
