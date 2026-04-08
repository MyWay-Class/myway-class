import {
  demoAudioExtractions,
  demoLectureNotes,
  demoLecturePipelines,
  demoLectureTranscripts,
  demoLectures,
} from './demo-data';
import type {
  AudioExtraction,
  AudioExtractionRequest,
  Lecture,
  LectureNote,
  LecturePipeline,
  LectureTranscript,
  MediaSummaryRequest,
  MediaSummaryStyle,
  TranscriptCreateRequest,
  TranscriptSegment,
} from './types';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'into',
  '그리고', '하지만', '때문에', '여기서', '다음', '정리', '강의', '내용', '설명',
]);

function now(): string {
  return new Date().toISOString();
}

function findLecture(lectureId: string): Lecture | undefined {
  return demoLectures.find((lecture) => lecture.id === lectureId);
}

function createId(prefix: string, itemsLength: number): string {
  return `${prefix}_${String(itemsLength + 1).padStart(3, '0')}`;
}

function formatTimeLabel(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function splitIntoSegments(text: string, durationMs: number): TranscriptSegment[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const segmentCount = Math.min(6, Math.max(3, Math.ceil(words.length / 10)));
  const wordsPerSegment = Math.max(1, Math.ceil(words.length / segmentCount));

  return Array.from({ length: segmentCount }, (_, index) => {
    const startWord = index * wordsPerSegment;
    const endWord = Math.min(words.length, startWord + wordsPerSegment);
    const startMs = Math.round((index / segmentCount) * durationMs);
    const endMs = index === segmentCount - 1 ? durationMs : Math.round(((index + 1) / segmentCount) * durationMs);

    return {
      index,
      start_ms: startMs,
      end_ms: Math.max(startMs + 1000, endMs),
      text: words.slice(startWord, endWord).join(' '),
    };
  }).filter((segment) => segment.text.length > 0);
}

function extractKeyConcepts(text: string, limit: number): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|,\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, self) => self.indexOf(part) === index)
    .slice(0, limit);
}

function extractKeywords(text: string, limit: number): string[] {
  const tokens = normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return Array.from(new Set(tokens)).slice(0, limit);
}

function summarizeByStyle(text: string, style: MediaSummaryStyle): string {
  const sentences = normalizeText(text)
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (style === 'detailed') {
    return sentences.slice(0, 4).map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
  }

  if (style === 'timeline') {
    return sentences.slice(0, 3).map((sentence, index) => `[${formatTimeLabel(index * 60000)}] ${sentence}`).join('\n');
  }

  return sentences.slice(0, 2).join(' ');
}

function buildTimelineMarkers(segments: TranscriptSegment[]): { time_ms: number; label: string; description: string }[] {
  return segments.slice(0, 6).map((segment) => ({
    time_ms: segment.start_ms,
    label: formatTimeLabel(segment.start_ms),
    description: segment.text.slice(0, 100),
  }));
}

function getPipelineIndex(lectureId: string): number {
  return demoLecturePipelines.findIndex((item) => item.lecture_id === lectureId);
}

function upsertPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): LecturePipeline {
  const existingIndex = getPipelineIndex(partial.lecture_id);
  const base: LecturePipeline = existingIndex >= 0
    ? {
        lecture_id: partial.lecture_id,
        transcript_status: demoLecturePipelines[existingIndex]?.transcript_status ?? 'PENDING',
        summary_status: demoLecturePipelines[existingIndex]?.summary_status ?? 'PENDING',
        audio_status: demoLecturePipelines[existingIndex]?.audio_status ?? 'PENDING',
        transcript_id: demoLecturePipelines[existingIndex]?.transcript_id ?? null,
        note_id: demoLecturePipelines[existingIndex]?.note_id ?? null,
        extraction_id: demoLecturePipelines[existingIndex]?.extraction_id ?? null,
        updated_at: demoLecturePipelines[existingIndex]?.updated_at ?? now(),
      }
    : {
        lecture_id: partial.lecture_id,
        transcript_status: 'PENDING',
        summary_status: 'PENDING',
        audio_status: 'PENDING',
        transcript_id: null,
        note_id: null,
        extraction_id: null,
        updated_at: now(),
      };

  const next: LecturePipeline = {
    ...base,
    ...partial,
    updated_at: now(),
  };

  if (existingIndex >= 0) {
    demoLecturePipelines[existingIndex] = next;
  } else {
    demoLecturePipelines.push(next);
  }

  return next;
}

export function getLectureTranscript(lectureId: string): LectureTranscript | undefined {
  return demoLectureTranscripts.find((item) => item.lecture_id === lectureId);
}

export function listLectureTranscripts(lectureId: string): LectureTranscript[] {
  return demoLectureTranscripts
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listLectureNotes(lectureId: string): LectureNote[] {
  return demoLectureNotes
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listAudioExtractions(lectureId: string): AudioExtraction[] {
  return demoAudioExtractions
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLecturePipeline(lectureId: string): LecturePipeline {
  const existing = demoLecturePipelines.find((item) => item.lecture_id === lectureId);

  if (existing) {
    return existing;
  }

  const transcript = getLectureTranscript(lectureId);
  const notes = listLectureNotes(lectureId);
  const extractions = listAudioExtractions(lectureId);

  return {
    lecture_id: lectureId,
    transcript_status: transcript ? 'COMPLETED' : 'PENDING',
    summary_status: notes.length > 0 ? 'COMPLETED' : 'PENDING',
    audio_status: extractions.length > 0 ? 'COMPLETED' : 'PENDING',
    transcript_id: transcript?.id ?? null,
    note_id: notes[0]?.id ?? null,
    extraction_id: extractions[0]?.id ?? null,
    updated_at: now(),
  };
}

export function createLectureTranscript(
  userId: string,
  input: TranscriptCreateRequest,
): { transcript: LectureTranscript; pipeline: LecturePipeline } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const fullText = normalizeText(input.text || lecture.content_text || '');
  if (!fullText) {
    return null;
  }

  const durationMs = input.duration_ms ?? Math.max(lecture.duration_minutes * 60_000, fullText.length * 40, 180_000);
  const transcript: LectureTranscript = {
    id: createId('trs', demoLectureTranscripts.length),
    lecture_id: lecture.id,
    user_id: userId,
    language: input.language ?? 'ko',
    full_text: fullText,
    segments: splitIntoSegments(fullText, durationMs),
    word_count: fullText.split(/\s+/).filter(Boolean).length,
    duration_ms: durationMs,
    stt_provider: input.stt_provider ?? (input.text ? 'text-derived-stt' : 'demo-stt'),
    stt_model: input.stt_model ?? 'pseudo-stt-v1',
    created_at: now(),
  };

  demoLectureTranscripts.push(transcript);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    transcript_status: 'COMPLETED',
    transcript_id: transcript.id,
  });

  return { transcript, pipeline };
}

export function createLectureSummaryNote(
  userId: string,
  input: MediaSummaryRequest,
): { note: LectureNote; pipeline: LecturePipeline; keyConcepts: string[]; keywords: string[] } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const transcript = getLectureTranscript(lecture.id);
  const sourceText = transcript?.full_text ?? lecture.content_text;
  const style = input.style ?? 'brief';
  const keyConcepts = extractKeyConcepts(sourceText, style === 'detailed' ? 5 : 3);
  const keywords = extractKeywords(sourceText, 5);
  const summaryContent = summarizeByStyle(sourceText, style);
  const timestamps = style === 'timeline'
    ? buildTimelineMarkers(transcript?.segments ?? splitIntoSegments(sourceText, Math.max(lecture.duration_minutes * 60_000, 180_000)))
    : null;

  const note: LectureNote = {
    id: createId('note', demoLectureNotes.length),
    lecture_id: lecture.id,
    user_id: userId,
    note_type: style === 'detailed' ? 'ai_detailed' : style === 'timeline' ? 'ai_timeline' : 'ai_summary',
    title: `${lecture.title} - ${style === 'detailed' ? '상세 요약' : style === 'timeline' ? '타임라인 요약' : '핵심 요약'}`,
    content: summaryContent,
    key_concepts: keyConcepts,
    keywords,
    timestamps,
    language: input.language ?? 'ko',
    ai_model: 'demo-summary-v1',
    created_at: now(),
  };

  demoLectureNotes.push(note);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    summary_status: 'COMPLETED',
    note_id: note.id,
  });

  return { note, pipeline, keyConcepts, keywords };
}

export function createAudioExtraction(
  userId: string,
  input: AudioExtractionRequest,
): { extraction: AudioExtraction; pipeline: LecturePipeline } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const extraction: AudioExtraction = {
    id: createId('aud', demoAudioExtractions.length),
    lecture_id: lecture.id,
    user_id: userId,
    source_type: 'video',
    source_url: input.video_url ?? '/static/media/demo-lecture.mp4',
    audio_format: 'wav',
    audio_duration_ms: Math.max(lecture.duration_minutes * 60_000, 30_000),
    sample_rate: 16_000,
    channels: 1,
    status: 'COMPLETED',
    transcript_id: getLectureTranscript(lecture.id)?.id ?? null,
    stt_status: getLectureTranscript(lecture.id) ? 'COMPLETED' : 'PENDING',
    created_at: now(),
  };

  demoAudioExtractions.push(extraction);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    audio_status: 'COMPLETED',
    extraction_id: extraction.id,
  });

  return { extraction, pipeline };
}

export function buildPipelineOverview(lectureId: string): LecturePipeline {
  return getLecturePipeline(lectureId);
}
