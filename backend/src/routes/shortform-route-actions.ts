import {
  getCourseDetail,
  getLectureDetail,
  getShortformVideoDetail,
  listLectureTranscripts,
  type TranscriptChunk,
  type ShortformGenerateRequest,
  type ShortformComposeRequest,
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
  const extractionId = body?.extraction_id?.trim();
  const title = body?.title?.trim();
  if (!extractionId || !title) return null;

  const video = composeShortformVideo(userId, {
    extraction_id: extractionId,
    title,
    candidate_ids: body?.candidate_ids,
    description: body?.description?.trim(),
  });
  if (!video) return null;

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
