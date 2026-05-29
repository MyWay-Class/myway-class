import { useEffect, useState } from 'react';
import type { CourseCard, LoginResponse } from '@myway/shared';
import { loadManagedCourses } from '../../../lib/api';
import type { SortMode, StatusFilter, ViewMode } from './useMyCoursesDerived';

type UseMyCoursesWorkspaceInput = {
  session: LoginResponse;
};

export function useMyCoursesWorkspace({ session }: UseMyCoursesWorkspaceInput) {
  const [managedCourses, setManagedCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('progress');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [notice, setNotice] = useState('내가 수강 중인 강의를 먼저 보고, 선택하면 상세와 진도율 화면으로 이어집니다.');

  useEffect(() => {
    let active = true;
    async function load() {
      if (session.user.role === 'STUDENT') {
        if (!active) return;
        setManagedCourses([]);
        setLoading(false);
        setNotice('수강 중인 강의 목록을 확인하고 상세/시청으로 이동할 수 있습니다.');
        return;
      }
      setLoading(true);
      const result = await loadManagedCourses(session.session_token);
      if (!active) return;
      setManagedCourses(result);
      setLoading(false);
      setNotice(result.length > 0 ? `관리 중인 강의 ${result.length}개를 확인할 수 있습니다.` : '아직 관리 중인 강의가 없습니다.');
    }
    void load();
    return () => {
      active = false;
    };
  }, [session.session_token, session.user.role]);

  return {
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
  };
}
