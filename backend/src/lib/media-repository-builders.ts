import type {
  AudioExtraction,
  AudioExtractionCallbackRequest,
  AudioExtractionRequest,
  Lecture,
  LectureNote,
  LectureTranscript,
  MediaSummaryRequest,
  TranscriptCreateRequest,
} from '@myway/shared';
import { buildTranscriptChunks } from '@myway/shared';
import {
  buildTimelineMarkers,
  extractKeyConcepts,
  extractKeywords,
  normalizeText,
  now,
  splitIntoSegments,
  summarizeByStyle,
} from '@myway/shared/lms/media/helpers';

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

export function inferAudioFormat(source: string | undefined): string {
  if (!source) {
    return 'pending';
  }
  const normalized = source.split('?')[0]?.split('#')[0] ?? '';
  const extension = normalized.includes('.') ? normalized.split('.').pop()?.toLowerCase() : '';
  if (!extension) {
    return 'wav';
  }
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'webm'].includes(extension)) {
    return extension;
  }
  return 'wav';
}

export function buildLectureTranscript(
  lecture: Lecture,
  userId: string,
  input: TranscriptCreateRequest,
): LectureTranscript | null {
  const fullText = normalizeText(input.text || lecture.content_text || '');
  if (!fullText) {
    return null;
  }
  const fallbackDurationMs = Math.max(lecture.duration_minutes * 60_000, fullText.length * 40, 180_000);
  const transcriptId = createId('trs');
  const segments = input.segments?.length
    ? buildTranscriptChunks(
        lecture.id,
        input.segments.map((segment, index) => ({
          ...segment,
          text: normalizeText(segment.text),
          chunk_index: segment.chunk_index ?? segment.index ?? index,
          index: segment.index ?? segment.chunk_index ?? index,
        })),
        transcriptId,
      )
    : buildTranscriptChunks(
        lecture.id,
        splitIntoSegments(fullText, input.duration_ms ?? fallbackDurationMs).map((segment) => ({
          lecture_id: lecture.id,
          start_ms: segment.start_ms,
          end_ms: segment.end_ms,
          text: segment.text,
          chunk_index: segment.index,
          index: segment.index,
          confidence: 0.9,
          speaker: null,
          topic_tags: [],
        })),
        transcriptId,
      );
  const durationMs =
    input.duration_ms ?? (segments.length > 0 ? segments[segments.length - 1]?.end_ms ?? fallbackDurationMs : fallbackDurationMs);
  const wordCount = input.word_count ?? fullText.split(/\s+/).filter(Boolean).length;
  return {
    id: transcriptId,
    lecture_id: lecture.id,
    user_id: userId,
    language: input.language ?? 'ko',
    full_text: fullText,
    segments,
    word_count: wordCount,
    duration_ms: durationMs,
    stt_provider: input.stt_provider ?? (input.text ? 'text-derived-stt' : 'demo-stt'),
    stt_model: input.stt_model ?? 'pseudo-stt-v1',
    created_at: now(),
  };
}

export function buildLectureSummaryNote(
  lecture: Lecture,
  userId: string,
  input: MediaSummaryRequest,
  transcript?: LectureTranscript,
): { note: LectureNote; keyConcepts: string[]; keywords: string[] } {
  const sourceText = transcript?.full_text ?? lecture.content_text;
  const style = input.style ?? 'brief';
  const keyConcepts = extractKeyConcepts(sourceText, style === 'detailed' ? 5 : 3);
  const keywords = extractKeywords(sourceText, 5);
  const summaryContent = summarizeByStyle(sourceText, style);
  const timestamps =
    style === 'timeline'
      ? buildTimelineMarkers(transcript?.segments ?? splitIntoSegments(sourceText, Math.max(lecture.duration_minutes * 60_000, 180_000)))
      : null;

  let noteType: LectureNote['note_type'] = 'ai_summary';
  let titleSuffix = '핵심 요약';
  if (style === 'detailed') {
    noteType = 'ai_detailed';
    titleSuffix = '상세 요약';
  } else if (style === 'timeline') {
    noteType = 'ai_timeline';
    titleSuffix = '타임라인 요약';
  }

  return {
    note: {
      id: createId('note'),
      lecture_id: lecture.id,
      user_id: userId,
      note_type: noteType,
      title: `${lecture.title} - ${titleSuffix}`,
      content: summaryContent,
      key_concepts: keyConcepts,
      keywords,
      timestamps,
      language: input.language ?? 'ko',
      ai_model: 'demo-summary-v1',
      created_at: now(),
    },
    keyConcepts,
    keywords,
  };
}

export function buildAudioExtraction(
  lecture: Lecture,
  userId: string,
  input: AudioExtractionRequest,
  existingTranscript?: LectureTranscript,
): AudioExtraction {
  const currentTime = now();
  return {
    id: createId('aud'),
    lecture_id: lecture.id,
    user_id: userId,
    source_type: 'video',
    source_url: input.video_url ?? '/static/media/demo-lecture.mp4',
    source_video_key: input.video_asset_key,
    source_video_name: input.source_file_name,
    source_content_type: input.source_content_type,
    source_size_bytes: input.source_size_bytes,
    language: input.language ?? 'ko',
    requested_stt_provider: input.stt_provider,
    requested_stt_model: input.stt_model,
    processing_job_id: null,
    processing_error: null,
    audio_url: input.audio_url ?? null,
    audio_format: input.audio_url ? inferAudioFormat(input.audio_url) : 'pending',
    audio_duration_ms: Math.max(lecture.duration_minutes * 60_000, 30_000),
    sample_rate: 16_000,
    channels: 1,
    status: input.audio_url ? 'COMPLETED' : 'PROCESSING',
    transcript_id: existingTranscript?.id ?? null,
    stt_status: existingTranscript ? 'COMPLETED' : input.audio_url ? 'PROCESSING' : 'PENDING',
    created_at: currentTime,
    processed_at: input.audio_url ? currentTime : null,
    updated_at: currentTime,
  };
}

export function applyAudioExtractionCallback(
  current: AudioExtraction,
  input: AudioExtractionCallbackRequest & { transcript_id?: string | null; stt_status?: AudioExtraction['stt_status'] },
): AudioExtraction {
  const nextStatus = input.status;
  const resolvedStatus = current.status === 'COMPLETED' && nextStatus === 'PROCESSING' ? current.status : nextStatus;
  return {
    ...current,
    processing_job_id: input.processing_job_id ?? current.processing_job_id ?? null,
    processing_error: input.error_message ?? (resolvedStatus === 'FAILED' ? '오디오 추출에 실패했습니다.' : null),
    audio_url: input.audio_url ?? current.audio_url ?? null,
    audio_format: input.audio_format ?? (input.audio_url ? inferAudioFormat(input.audio_url) : current.audio_format),
    audio_duration_ms: input.audio_duration_ms ?? current.audio_duration_ms,
    sample_rate: input.sample_rate ?? current.sample_rate,
    channels: input.channels ?? current.channels,
    status: resolvedStatus,
    transcript_id: input.transcript_id ?? current.transcript_id,
    stt_status:
      input.stt_status ??
      (resolvedStatus === 'FAILED' ? 'FAILED' : input.transcript_id ? 'COMPLETED' : current.stt_status),
    processed_at: resolvedStatus === 'COMPLETED' ? current.processed_at ?? now() : current.processed_at ?? null,
    updated_at: now(),
  };
}
