import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CustomCourseLibraryItem, ShortformLibraryItem } from '@myway/shared';
import {
  copyCustomCourseDraft,
  loadCustomCourseLibrary,
  loadShortformLibrary,
  retryShortformExportDraft,
  saveShortformDraft,
  shareCustomCourseDraft,
  shareShortformDraft,
  toggleShortformLikeDraft,
} from '../../../lib/api';

type UseMyShortformsPageActionsParams = {
  sessionToken: string | null;
  setCustomCourses: Dispatch<SetStateAction<CustomCourseLibraryItem[]>>;
  setShortformLibrary: Dispatch<SetStateAction<ShortformLibraryItem[]>>;
  setStatus: (value: string) => void;
};

export function useMyShortformsPageActions({
  sessionToken,
  setCustomCourses,
  setShortformLibrary,
  setStatus,
}: UseMyShortformsPageActionsParams) {
  const refreshLibrary = useCallback(async () => {
    const [customCourseData, shortformData] = await Promise.all([
      loadCustomCourseLibrary(sessionToken),
      loadShortformLibrary(sessionToken),
    ]);

    setCustomCourses(customCourseData);
    setShortformLibrary(shortformData);
    setStatus('라이브러리가 최신 상태입니다.');
  }, [sessionToken, setCustomCourses, setShortformLibrary, setStatus]);

  const handleShareCourse = useCallback(async (courseId: string) => {
    const ok = await shareCustomCourseDraft(courseId, { message: '공유 가능한 개인 코스입니다.' }, sessionToken);
    setStatus(ok ? '개인 코스를 공유했습니다.' : '개인 코스 공유에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  const handleCopyCourse = useCallback(async (courseId: string) => {
    const copied = await copyCustomCourseDraft(courseId, { custom_course_id: courseId }, sessionToken);
    setStatus(copied ? '개인 코스를 복사했습니다.' : '복사에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  const handleShareShortform = useCallback(async (videoId: string, courseId: string) => {
    const ok = await shareShortformDraft({ video_id: videoId, course_id: courseId, message: '학습용 숏폼을 공유합니다.' }, sessionToken);
    setStatus(ok ? '숏폼을 공유했습니다.' : '숏폼 공유에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  const handleSaveShortform = useCallback(async (videoId: string) => {
    const ok = await saveShortformDraft({ video_id: videoId, folder: 'library', note: '학습 라이브러리 저장' }, sessionToken);
    setStatus(ok ? '숏폼을 라이브러리에 저장했습니다.' : '저장에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  const handleLikeShortform = useCallback(async (videoId: string) => {
    const ok = await toggleShortformLikeDraft(videoId, sessionToken);
    setStatus(ok ? '좋아요 상태를 반영했습니다.' : '좋아요 처리에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  const handleRetryExport = useCallback(async (videoId: string) => {
    const ok = await retryShortformExportDraft(videoId, sessionToken);
    setStatus(ok ? '숏폼 export를 다시 시작했습니다.' : '숏폼 export 재시도에 실패했습니다.');
    await refreshLibrary();
  }, [refreshLibrary, sessionToken, setStatus]);

  return {
    refreshLibrary,
    handleShareCourse,
    handleCopyCourse,
    handleShareShortform,
    handleSaveShortform,
    handleLikeShortform,
    handleRetryExport,
  };
}
