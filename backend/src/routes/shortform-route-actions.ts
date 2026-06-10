import {
  getCourseDetail,
  getLectureDetail,
  getShortformVideoDetail,
  listLectureTranscripts,
  createShortformVideoFromCandidates,
  type TranscriptChunk,
  type ShortformGenerateRequest,
  type ShortformComposeRequest,
  type ShortformCandidate,
  type ShortformExtraction,
  type ShortformVideoDetail,
  type MediaRepository,
  generateShortformExtraction,
  composeShortformVideo,
  updateVideoExport,
} from '@myway/shared';
import { buildFallbackLectureTranscript } from '../lib/transcript-fallback';

export async function generateShortformCandidates(
  userId: string,
  body: ShortformGenerateRequest | null,
  repository?: MediaRepository,
) {
  const courseId = body?.course_id?.trim();
  if (!courseId) return null;

  const transcriptSegmentsByLecture: Record<string, Array<{ start_ms: number; end_ms: number; text: string }>> = {};
  const transcriptChunksByLecture: Record<string, TranscriptChunk[]> = {};
  const course = getCourseDetail(courseId, userId);
  const lectureIds =
    body?.mode === 'single' && body?.lecture_id?.trim()
      ? [body.lecture_id.trim()]
      : course?.lectures.map((lecture) => lecture.id) ?? [];

  if (repository && lectureIds.length > 0) {
    for (const lectureId of lectureIds) {
      const transcript = (await listLectureTranscripts(lectureId, repository))[0] ?? buildFallbackLectureTranscript(getLectureDetail(lectureId, userId));
      if (transcript?.segments?.length) {
        transcriptChunksByLecture[lectureId] = transcript.segments;
        transcriptSegmentsByLecture[lectureId] = transcript.segments.map((segment) => ({
          start_ms: segment.start_ms,
          end_ms: segment.end_ms,
          text: segment.text,
        }));
      }
    }
  }

  return generateShortformExtraction(userId, {
    lecture_id: body?.lecture_id?.trim(),
    course_id: courseId,
    mode: body?.mode ?? 'cross',
    style: body?.style ?? 'highlight',
    target_duration_sec: body?.target_duration_sec ?? 300,
    language: body?.language ?? 'ko',
    transcript_chunks_by_lecture: transcriptChunksByLecture,
    transcript_segments_by_lecture: transcriptSegmentsByLecture,
  });
}

export function composeShortformAndMarkProcessing(userId: string, body: ShortformComposeRequest | null): ShortformVideoDetail | null {
  const title = body?.title?.trim();
  if (!title) return null;
  const extractionId = body?.extraction_id?.trim() || `sfe_fallback_${Date.now()}`;

  const video = composeShortformVideo(userId, {
    extraction_id: extractionId,
    title,
    candidate_ids: body?.candidate_ids,
    description: body?.description?.trim(),
  });
  if (video) {
    updateVideoExport(video.id, {
      export_status: 'PROCESSING',
      export_error_message: null,
      export_failure_reason: null,
      export_result_url: null,
      export_job_id: null,
      export_retry_count: 0,
    });
    return getShortformVideoDetail(video.id) ?? null;
  }

  const timelineClips = body?.timeline_project?.clips ?? body?.clips ?? [];
  if (!timelineClips.length) {
    return null;
  }

  const selectedCandidateIds = body?.candidate_ids?.length
    ? body.candidate_ids.map((candidateId, index) => candidateId?.trim() || `cand_fallback_${index}`)
    : timelineClips.map((_, index) => `cand_fallback_${index}`);
  const extractionCourseId = body?.course_id?.trim() ?? body?.timeline_project?.course_id?.trim() ?? 'course_unknown';
  const extraction: ShortformExtraction = {
    id: extractionId,
    user_id: userId,
    course_id: extractionCourseId,
    mode: 'single',
    lecture_ids: Array.from(new Set(timelineClips.map((clip) => clip.lecture_id).filter(Boolean))),
    style: 'highlight',
    target_duration_sec: Math.max(30, Math.round(timelineClips.reduce((sum, clip) => sum + Math.max(1, clip.end_ms - clip.start_ms), 0) / 1000)),
    language: 'ko',
    ai_model: 'timeline-fallback-v1',
    ai_response: 'timeline_project 기반으로 숏폼이 구성되었습니다.',
    total_candidates: timelineClips.length,
    created_at: new Date().toISOString(),
  };
  const candidates: ShortformCandidate[] = timelineClips.map((clip, index) => ({
    id: selectedCandidateIds[index] ?? `cand_fallback_${index}`,
    extraction_id: extraction.id,
    lecture_id: clip.lecture_id,
    lecture_title: getLectureDetail(clip.lecture_id, userId)?.title ?? clip.lecture_id,
    course_id: extractionCourseId,
    start_time_ms: Math.max(0, Math.round(clip.start_ms)),
    end_time_ms: Math.max(Math.round(clip.start_ms) + 1000, Math.round(clip.end_ms)),
    label: `timeline clip ${index + 1}`,
    description: body?.timeline_project?.clips?.[index]?.note?.trim() ?? body?.timeline_project?.clips?.[index]?.text?.trim() ?? `clip ${index + 1}`,
    importance: Math.max(0.4, 0.92 - index * 0.05),
    order_index: index,
    is_selected: true,
  }));
  const fallbackVideo = createShortformVideoFromCandidates(userId, extraction, title, body?.description?.trim() ?? '', candidates);
  if (!fallbackVideo) return null;

  updateVideoExport(fallbackVideo.id, {
    export_status: 'PROCESSING',
    export_error_message: null,
    export_failure_reason: null,
    export_result_url: null,
    export_job_id: null,
    export_retry_count: 0,
  });
  return getShortformVideoDetail(fallbackVideo.id) ?? null;
}
