import { useEffect, useMemo, useRef, useState } from 'react';
import type { CourseDetail, LectureDetail, LectureTranscript } from '@myway/shared';
import { loadLectureTranscriptDetailedResult, saveLectureVideoMappingDetailed } from '../../../lib/api-media';
import { buildProtectedVideoUrl, resolveLectureVideoUrl } from '../../../lib/video-url';
import { buildLectureTranscriptFallback } from './lectureTranscriptFallback';

type VideoPlaybackErrorKind = 'forbidden' | 'not_found' | 'unknown' | null;
type TranscriptAccessState = 'loading' | 'ready' | 'empty' | 'forbidden' | 'error';

type Params = {
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  sessionToken?: string | null;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'my-courses' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function useLectureWatchPlayback({
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onSelectLecture,
  onNavigate,
}: Params) {
  const [activePanelTab, setActivePanelTab] = useState<'sessions' | 'script' | 'chat'>('sessions');
  const [transcript, setTranscript] = useState<LectureTranscript | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptAccessState, setTranscriptAccessState] = useState<TranscriptAccessState>('ready');
  const [videoErrorKind, setVideoErrorKind] = useState<VideoPlaybackErrorKind>(null);
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null);
  const [videoChecking, setVideoChecking] = useState(false);
  const [remapAssetKey, setRemapAssetKey] = useState('');
  const [remapMessage, setRemapMessage] = useState<string | null>(null);
  const [remapBusy, setRemapBusy] = useState(false);
  const [pendingSeek, setPendingSeek] = useState<{ lectureId: string; startMs: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isLocked = Boolean(selectedCourse && !selectedCourse.enrolled && !canManageCurrent);
  const currentLecture = useMemo(() => {
    if (!selectedCourse) return highlightedLecture;
    return selectedCourse.lectures.find((lecture) => lecture.id === selectedLectureId) ?? highlightedLecture ?? selectedCourse.lectures[0] ?? null;
  }, [highlightedLecture, selectedCourse, selectedLectureId]);
  const resolvedLectureVideoUrl = currentLecture ? resolveLectureVideoUrl(currentLecture) : undefined;
  const protectedVideoUrl = buildProtectedVideoUrl(resolvedLectureVideoUrl, sessionToken);
  const upcomingLectures = useMemo(() => {
    if (!selectedCourse || !currentLecture) return [];
    const currentIndex = selectedCourse.lectures.findIndex((lecture) => lecture.id === currentLecture.id);
    return selectedCourse.lectures.slice(Math.max(currentIndex + 1, 0), currentIndex + 5);
  }, [currentLecture, selectedCourse]);

  useEffect(() => {
    let active = true;
    if (!currentLecture?.id || isLocked) {
      setTranscript(null);
      setTranscriptAccessState('ready');
      return () => {
        active = false;
      };
    }
    if (!sessionToken) {
      setTranscript(buildLectureTranscriptFallback(currentLecture));
      setTranscriptAccessState('ready');
      return () => {
        active = false;
      };
    }
    setTranscriptLoading(true);
    setTranscriptAccessState('loading');
    void loadLectureTranscriptDetailedResult(currentLecture.id, sessionToken)
      .then((response) => {
        if (!active) return;
        if (!response) {
          setTranscript(null);
          setTranscriptAccessState('error');
          return;
        }
        if (response.success && response.data) {
          setTranscript(response.data);
          setTranscriptAccessState('ready');
          return;
        }
        const fallbackTranscript = buildLectureTranscriptFallback(currentLecture);
        setTranscript(fallbackTranscript);
        if (response.status === 403) {
          setTranscript(null);
          setTranscriptAccessState('forbidden');
        } else if (fallbackTranscript) {
          setTranscriptAccessState('ready');
        } else if (response.success && response.data === null) {
          setTranscriptAccessState('empty');
        } else {
          setTranscript(null);
          setTranscriptAccessState('error');
        }
      })
      .finally(() => {
        if (active) setTranscriptLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentLecture?.id, isLocked, sessionToken]);

  useEffect(() => {
    let active = true;
    setVideoErrorKind(null);
    setVideoErrorMessage(null);
    setVideoChecking(false);

    if (isLocked || !resolvedLectureVideoUrl || !protectedVideoUrl) {
      return () => {
        active = false;
      };
    }

    const check = async () => {
      setVideoChecking(true);
      try {
        const response = await fetch(protectedVideoUrl, { method: 'GET', headers: { Range: 'bytes=0-1' } });
        if (!active) return;
        if (response.ok) return;
        if (response.status === 403) {
          setVideoErrorKind('forbidden');
          setVideoErrorMessage('영상 접근 권한이 없습니다. 토큰 또는 자산 권한을 확인해 주세요.');
          return;
        }
        if (response.status === 404) {
          setVideoErrorKind('not_found');
          setVideoErrorMessage('영상 파일을 찾지 못했습니다. R2 키 매핑을 확인해 주세요.');
          return;
        }
        setVideoErrorKind('unknown');
        setVideoErrorMessage(`영상 재생 확인에 실패했습니다. (HTTP ${response.status})`);
      } catch {
        if (active) {
          setVideoErrorKind('unknown');
          setVideoErrorMessage('영상 재생 확인 중 네트워크 오류가 발생했습니다.');
        }
      } finally {
        if (active) setVideoChecking(false);
      }
    };

    void check();
    return () => {
      active = false;
    };
  }, [resolvedLectureVideoUrl, isLocked, protectedVideoUrl]);

  function seekVideoTo(startMs: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.floor(startMs / 1000));
    const playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      void playResult.catch(() => {});
    }
  }

  async function handleRemapAssetKey() {
    if (!currentLecture?.id || !remapAssetKey.trim()) {
      setRemapMessage('강의 ID와 asset key를 확인해 주세요.');
      return;
    }
    setRemapBusy(true);
    setRemapMessage(null);
    const response = await saveLectureVideoMappingDetailed(
      { lecture_id: currentLecture.id, asset_key: remapAssetKey.trim() },
      sessionToken
    );
    setRemapBusy(false);
    if (response?.success) {
      setRemapMessage('R2 재매핑을 저장했습니다. 잠시 후 다시 재생을 시도해 주세요.');
      setVideoErrorKind(null);
      setVideoErrorMessage(null);
      return;
    }
    setRemapMessage(response?.error?.message ?? '재매핑 저장에 실패했습니다.');
  }

  function handleSeekFromChat(startMs: number, lectureId?: string | null) {
    const targetLectureId = (lectureId ?? '').trim();
    const activeLectureId = currentLecture?.id ?? '';
    if (targetLectureId && activeLectureId && targetLectureId !== activeLectureId) {
      const existsInCourse = Boolean(selectedCourse?.lectures.some((lecture) => lecture.id === targetLectureId));
      if (existsInCourse) {
        setPendingSeek({ lectureId: targetLectureId, startMs });
        onSelectLecture(targetLectureId);
        return;
      }
      onNavigate('courses');
      return;
    }
    seekVideoTo(startMs);
  }

  useEffect(() => {
    if (!pendingSeek || !currentLecture?.id || pendingSeek.lectureId !== currentLecture.id) return;
    seekVideoTo(pendingSeek.startMs);
    setPendingSeek(null);
  }, [currentLecture?.id, pendingSeek]);

  return {
    activePanelTab,
    setActivePanelTab,
    transcript,
    transcriptLoading,
    transcriptAccessState,
    videoErrorKind,
    setVideoErrorKind,
    videoErrorMessage,
    setVideoErrorMessage,
    videoChecking,
    remapAssetKey,
    setRemapAssetKey,
    remapMessage,
    remapBusy,
    currentLecture,
    isLocked,
    protectedVideoUrl,
    upcomingLectures,
    videoRef,
    seekVideoTo,
    handleSeekFromChat,
    handleRemapAssetKey,
  };
}
