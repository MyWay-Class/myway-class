import type { Dispatch, SetStateAction } from 'react';
import type { CourseDetail, ShortformVideo } from '@myway/shared';
import {
  composeShortformDraft,
  loadShortformCommunity,
  shareShortformDraft,
} from '../../../lib/api-shortforms';
import type { ClipSuggestion } from './ShortformWizardTypes';
import { clipKey, mapComposeError, MAX_CLIP_MS, MIN_CLIP_MS } from './shortformWizardUtils';

type UseShortformWizardActionsParams = {
  courseDetail: CourseDetail | null;
  selectedClips: ClipSuggestion[];
  title: string;
  description: string;
  sessionToken: string | null;
  createdVideo: ShortformVideo | null;
  setStatus: (value: string) => void;
  setCreatedVideo: (value: ShortformVideo | null) => void;
  setCommunityItems: (value: any[]) => void;
  setStep: (value: 1 | 2 | 3) => void;
  setSelectedClips: Dispatch<SetStateAction<ClipSuggestion[]>>;
};

export function useShortformWizardActions({
  courseDetail,
  selectedClips,
  title,
  description,
  sessionToken,
  createdVideo,
  setStatus,
  setCreatedVideo,
  setCommunityItems,
  setStep,
  setSelectedClips,
}: UseShortformWizardActionsParams) {
  async function handleCompose() {
    if (!courseDetail || selectedClips.length === 0) {
      setStatus('조립할 강의와 클립이 필요합니다.');
      return;
    }
    setStatus('선택한 구간으로 숏폼을 생성하는 중입니다.');
    const result = await composeShortformDraft(
      {
        course_id: courseDetail.id,
        title: title.trim() || `${courseDetail.title} 숏폼`,
        description,
        clips: selectedClips.map((clip) => ({ lecture_id: clip.lecture_id, start_ms: clip.start_time_ms, end_ms: clip.end_time_ms })),
      },
      sessionToken,
    );

    if (!result.video) {
      setStatus(mapComposeError(result.errorCode, result.errorMessage));
      return;
    }
    const video = result.video;
    setCreatedVideo(video);
    setStatus(video.export_status === 'COMPLETED' || video.export_result_url ? '숏폼이 생성되어 재생 가능합니다.' : '숏폼이 생성되었고 export를 처리 중입니다.');
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems((Array.isArray(refreshed) ? refreshed : []).slice(0, 4));
    setStep(3);
  }

  async function handleShare() {
    if (!createdVideo || !courseDetail) {
      setStatus('먼저 숏폼을 만들어야 공유할 수 있습니다.');
      return;
    }
    const shared = await shareShortformDraft({ video_id: createdVideo.id, course_id: courseDetail.id, message: '학습용 숏폼을 공유합니다.' }, sessionToken);
    setStatus(shared ? '숏폼을 공유했습니다.' : '공유에 실패했습니다.');
    const refreshed = await loadShortformCommunity(courseDetail.id, sessionToken);
    setCommunityItems((Array.isArray(refreshed) ? refreshed : []).slice(0, 4));
  }

  function toggleClip(clip: ClipSuggestion) {
    const key = clipKey(clip);
    setSelectedClips((current) => (current.some((item) => clipKey(item) === key) ? current.filter((item) => clipKey(item) !== key) : [...current, clip]));
  }

  function removeClip(key: string) {
    setSelectedClips((current) => current.filter((item) => clipKey(item) !== key));
  }

  function updateClipTimes(key: string, startTimeMs: number, endTimeMs: number) {
    setSelectedClips((current) =>
      current.map((clip) => {
        if (clipKey(clip) !== key) return clip;
        const requestedDuration = Math.max(MIN_CLIP_MS, endTimeMs - startTimeMs);
        const boundedDuration = Math.min(MAX_CLIP_MS, requestedDuration);
        const safeStart = Math.max(0, Math.min(startTimeMs, endTimeMs - MIN_CLIP_MS));
        const safeEnd = safeStart + boundedDuration;
        return { ...clip, start_time_ms: safeStart, end_time_ms: safeEnd };
      }),
    );
  }

  return { handleCompose, handleShare, toggleClip, removeClip, updateClipTimes };
}
