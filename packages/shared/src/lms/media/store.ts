import type {
  AudioExtraction,
  AudioExtractionCallbackRequest,
  AudioExtractionRequest,
  LectureNote,
  LecturePipeline,
  LectureTranscript,
  MediaSummaryRequest,
  TranscriptCreateRequest,
} from '../../types';
import {
  demoAudioExtractions,
  demoLectureNotes,
  demoLecturePipelines,
  demoLectureTranscripts,
} from '../../data/demo-data';
import { buildTimelineMarkers, createId, findLecture, now, normalizeText, splitIntoSegments, upsertPipeline } from './helpers';

export type MediaRepository = {
  getLectureTranscript(lectureId: string): LectureTranscript | undefined | Promise<LectureTranscript | undefined>;
  listLectureTranscripts(lectureId: string): LectureTranscript[] | Promise<LectureTranscript[]>;
  createLectureTranscript(
    userId: string,
    input: TranscriptCreateRequest,
  ): { transcript: LectureTranscript; pipeline: LecturePipeline } | null | Promise<{ transcript: LectureTranscript; pipeline: LecturePipeline } | null>;
  listLectureNotes(lectureId: string): LectureNote[] | Promise<LectureNote[]>;
  createLectureSummaryNote(
    userId: string,
    input: MediaSummaryRequest,
  ): { note: LectureNote; pipeline: LecturePipeline; keyConcepts: string[]; keywords: string[] } | null | Promise<{
    note: LectureNote;
    pipeline: LecturePipeline;
    keyConcepts: string[];
    keywords: string[];
  } | null>;
  listAudioExtractions(lectureId: string): AudioExtraction[] | Promise<AudioExtraction[]>;
  getAudioExtraction(extractionId: string): AudioExtraction | undefined | Promise<AudioExtraction | undefined>;
  createAudioExtraction(
    userId: string,
    input: AudioExtractionRequest,
  ): { extraction: AudioExtraction; pipeline: LecturePipeline } | null | Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null>;
  updateAudioExtraction(
    input: AudioExtractionCallbackRequest & {
      transcript_id?: string | null;
      stt_status?: AudioExtraction['stt_status'];
    },
  ): { extraction: AudioExtraction; pipeline: LecturePipeline } | null | Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null>;
  getLecturePipeline(lectureId: string): LecturePipeline | Promise<LecturePipeline>;
  upsertPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): LecturePipeline | Promise<LecturePipeline>;
};

function inferAudioFormat(source: string | undefined): string {
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

function getTranscriptIndex(lectureId: string): number {
  return demoLectureTranscripts.findIndex((item) => item.lecture_id === lectureId);
}

function getNoteIndex(lectureId: string): number {
  return demoLectureNotes.findIndex((item) => item.lecture_id === lectureId);
}

function getExtractionIndex(extractionId: string): number {
  return demoAudioExtractions.findIndex((item) => item.id === extractionId);
}

function getPipelineIndex(lectureId: string): number {
  return demoLecturePipelines.findIndex((item) => item.lecture_id === lectureId);
}

function upsertMemoryPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): LecturePipeline {
  const existingIndex = getPipelineIndex(partial.lecture_id);
  const base: LecturePipeline =
    existingIndex >= 0
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

export const memoryMediaRepository: MediaRepository = {
  getLectureTranscript(lectureId: string): LectureTranscript | undefined {
    return demoLectureTranscripts.find((item) => item.lecture_id === lectureId);
  },
  listLectureTranscripts(lectureId: string): LectureTranscript[] {
    return demoLectureTranscripts
      .filter((item) => item.lecture_id === lectureId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createLectureTranscript(
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

    const fallbackDurationMs = Math.max(lecture.duration_minutes * 60_000, fullText.length * 40, 180_000);
    const segments = input.segments?.length
      ? input.segments.map((segment, index) => ({
          index,
          start_ms: Math.max(0, Math.round(segment.start_ms)),
          end_ms: Math.max(Math.round(segment.start_ms), Math.round(segment.end_ms)),
          text: normalizeText(segment.text),
        }))
      : splitIntoSegments(fullText, input.duration_ms ?? fallbackDurationMs);
    const durationMs =
      input.duration_ms ??
      (segments.length > 0 ? segments[segments.length - 1]?.end_ms ?? fallbackDurationMs : fallbackDurationMs);
    const wordCount =
      input.word_count ??
      fullText.split(/\s+/).filter(Boolean).length;
    const transcript: LectureTranscript = {
      id: createId('trs', demoLectureTranscripts.length),
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

    demoLectureTranscripts.push(transcript);
    const pipeline = upsertMemoryPipeline({
      lecture_id: lecture.id,
      transcript_status: 'COMPLETED',
      transcript_id: transcript.id,
    });

    return { transcript, pipeline };
  },
  listLectureNotes(lectureId: string): LectureNote[] {
    return demoLectureNotes
      .filter((item) => item.lecture_id === lectureId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createLectureSummaryNote(
    userId: string,
    input: MediaSummaryRequest,
  ): { note: LectureNote; pipeline: LecturePipeline; keyConcepts: string[]; keywords: string[] } | null {
    const lecture = findLecture(input.lecture_id);
    if (!lecture) {
      return null;
    }

    const transcript = demoLectureTranscripts.find((item) => item.lecture_id === lecture.id);
    const sourceText = transcript?.full_text ?? lecture.content_text;
    const style = input.style ?? 'brief';
    const keyConcepts = sourceText
      .replaceAll(/\s+/g, ' ')
      .split(/[.!?]\s+|,\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part, index, self) => self.indexOf(part) === index)
      .slice(0, style === 'detailed' ? 5 : 3);
    const keywords = sourceText
      .replaceAll(/\s+/g, ' ')
      .toLowerCase()
      .split(/[^a-zA-Z0-9가-힣]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length > 1)
      .slice(0, 5);
    const summaryContent =
      style === 'detailed'
        ? sourceText
            .replaceAll(/\s+/g, ' ')
            .split(/[.!?]\s+/)
            .map((sentence, index) => `${index + 1}. ${sentence.trim()}`)
            .slice(0, 4)
            .join('\n')
        : style === 'timeline'
          ? sourceText
              .replaceAll(/\s+/g, ' ')
              .split(/[.!?]\s+/)
              .map((sentence, index) => `[${String(index).padStart(1, '0')}:00] ${sentence.trim()}`)
              .slice(0, 4)
              .join('\n')
          : sourceText
              .replaceAll(/\s+/g, ' ')
              .split(/[.!?]\s+/)
              .slice(0, 2)
              .join(' ');
    const timestamps =
      style === 'timeline'
        ? buildTimelineMarkers(transcript?.segments ?? splitIntoSegments(sourceText, Math.max(lecture.duration_minutes * 60_000, 180_000)))
        : null;

    const noteType: LectureNote['note_type'] =
      style === 'detailed' ? 'ai_detailed' : style === 'timeline' ? 'ai_timeline' : 'ai_summary';
    const titleSuffix = style === 'detailed' ? '상세 요약' : style === 'timeline' ? '타임라인 요약' : '핵심 요약';
    const note: LectureNote = {
      id: createId('note', demoLectureNotes.length),
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
    };

    demoLectureNotes.push(note);
    const pipeline = upsertMemoryPipeline({
      lecture_id: lecture.id,
      summary_status: 'COMPLETED',
      note_id: note.id,
    });

    return { note, pipeline, keyConcepts, keywords };
  },
  listAudioExtractions(lectureId: string): AudioExtraction[] {
    return demoAudioExtractions
      .filter((item) => item.lecture_id === lectureId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getAudioExtraction(extractionId: string): AudioExtraction | undefined {
    return demoAudioExtractions.find((item) => item.id === extractionId);
  },
  createAudioExtraction(
    userId: string,
    input: AudioExtractionRequest,
  ): { extraction: AudioExtraction; pipeline: LecturePipeline } | null {
    const lecture = findLecture(input.lecture_id);
    if (!lecture) {
      return null;
    }

    const existingTranscript = demoLectureTranscripts.find((item) => item.lecture_id === lecture.id);
    const extraction: AudioExtraction = {
      id: createId('aud', demoAudioExtractions.length),
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
      created_at: now(),
      processed_at: input.audio_url ? now() : null,
      updated_at: now(),
    };

    demoAudioExtractions.push(extraction);
    const pipeline = upsertMemoryPipeline({
      lecture_id: lecture.id,
      audio_status: extraction.status,
      extraction_id: extraction.id,
    });

    return { extraction, pipeline };
  },
  updateAudioExtraction(
    input: AudioExtractionCallbackRequest & {
      transcript_id?: string | null;
      stt_status?: AudioExtraction['stt_status'];
    },
  ): { extraction: AudioExtraction; pipeline: LecturePipeline } | null {
    const targetIndex = demoAudioExtractions.findIndex((item) => item.id === input.extraction_id && item.lecture_id === input.lecture_id);
    if (targetIndex < 0) {
      return null;
    }

    const current = demoAudioExtractions[targetIndex];
    const nextStatus = input.status;
    const resolvedStatus = current.status === 'COMPLETED' && nextStatus === 'PROCESSING' ? current.status : nextStatus;
    const next: AudioExtraction = {
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
        (resolvedStatus === 'FAILED'
          ? 'FAILED'
          : input.transcript_id
            ? 'COMPLETED'
            : current.stt_status),
      processed_at: resolvedStatus === 'COMPLETED' ? current.processed_at ?? now() : current.processed_at ?? null,
      updated_at: now(),
    };

    demoAudioExtractions[targetIndex] = next;
    const pipeline = upsertMemoryPipeline({
      lecture_id: next.lecture_id,
      audio_status: next.status,
      extraction_id: next.id,
      transcript_status: next.transcript_id ? 'COMPLETED' : next.stt_status,
      transcript_id: next.transcript_id,
    });

    return { extraction: next, pipeline };
  },
  getLecturePipeline(lectureId: string): LecturePipeline {
    const existing = demoLecturePipelines.find((item) => item.lecture_id === lectureId);

    if (existing) {
      return existing;
    }

    const transcript = demoLectureTranscripts.find((item) => item.lecture_id === lectureId);
    const notes = demoLectureNotes.filter((item) => item.lecture_id === lectureId);
    const extractions = demoAudioExtractions.filter((item) => item.lecture_id === lectureId);
    const latestExtraction = extractions[0];

    return {
      lecture_id: lectureId,
      transcript_status: transcript ? 'COMPLETED' : 'PENDING',
      summary_status: notes.length > 0 ? 'COMPLETED' : 'PENDING',
      audio_status: latestExtraction?.status ?? 'PENDING',
      transcript_id: transcript?.id ?? null,
      note_id: notes[0]?.id ?? null,
      extraction_id: latestExtraction?.id ?? null,
      updated_at: now(),
    };
  },
  upsertPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): LecturePipeline {
    return upsertMemoryPipeline(partial);
  },
};
