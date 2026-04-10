import type { D1Database } from '@cloudflare/workers-types';
import {
  type AudioExtraction,
  type AudioExtractionCallbackRequest,
  type AudioExtractionRequest,
  type LectureNote,
  type LecturePipeline,
  type LectureTranscript,
  type MediaSummaryRequest,
  type TranscriptCreateRequest,
  type MediaRepository,
} from '@myway/shared';
import {
  extractKeyConcepts,
  extractKeywords,
  findLecture,
  normalizeText,
  splitIntoSegments,
  summarizeByStyle,
  buildTimelineMarkers,
  now,
} from '@myway/shared/lms/media/helpers';

type TranscriptRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  language: string;
  full_text: string;
  segments_json: string;
  word_count: number;
  duration_ms: number;
  stt_provider: string;
  stt_model: string;
  created_at: string;
};

type NoteRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  note_type: LectureNote['note_type'];
  title: string;
  content: string;
  key_concepts_json: string;
  keywords_json: string;
  timestamps_json: string | null;
  language: string;
  ai_model: string;
  created_at: string;
};

type ExtractionRow = {
  id: string;
  lecture_id: string;
  user_id: string;
  source_type: AudioExtraction['source_type'];
  source_url: string;
  source_video_key: string | null;
  source_video_name: string | null;
  source_content_type: string | null;
  source_size_bytes: number | null;
  language: string | null;
  requested_stt_provider: string | null;
  requested_stt_model: string | null;
  processing_job_id: string | null;
  processing_error: string | null;
  audio_url: string | null;
  audio_format: string;
  audio_duration_ms: number;
  sample_rate: number;
  channels: number;
  status: AudioExtraction['status'];
  transcript_id: string | null;
  stt_status: AudioExtraction['stt_status'];
  created_at: string;
  processed_at: string | null;
  updated_at: string;
};

type PipelineRow = {
  lecture_id: string;
  transcript_status: LecturePipeline['transcript_status'];
  summary_status: LecturePipeline['summary_status'];
  audio_status: LecturePipeline['audio_status'];
  transcript_id: string | null;
  note_id: string | null;
  extraction_id: string | null;
  updated_at: string;
};

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function mapTranscriptRow(row: TranscriptRow): LectureTranscript {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    language: row.language,
    full_text: row.full_text,
    segments: parseJsonArray(row.segments_json),
    word_count: row.word_count,
    duration_ms: row.duration_ms,
    stt_provider: row.stt_provider,
    stt_model: row.stt_model,
    created_at: row.created_at,
  };
}

function mapNoteRow(row: NoteRow): LectureNote {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    note_type: row.note_type,
    title: row.title,
    content: row.content,
    key_concepts: parseJsonArray(row.key_concepts_json),
    keywords: parseJsonArray(row.keywords_json),
    timestamps: row.timestamps_json ? parseJsonArray(row.timestamps_json) : null,
    language: row.language,
    ai_model: row.ai_model,
    created_at: row.created_at,
  };
}

function mapExtractionRow(row: ExtractionRow): AudioExtraction {
  return {
    id: row.id,
    lecture_id: row.lecture_id,
    user_id: row.user_id,
    source_type: row.source_type,
    source_url: row.source_url,
    source_video_key: row.source_video_key ?? undefined,
    source_video_name: row.source_video_name ?? undefined,
    source_content_type: row.source_content_type ?? undefined,
    source_size_bytes: row.source_size_bytes ?? undefined,
    language: row.language ?? undefined,
    requested_stt_provider: row.requested_stt_provider ?? undefined,
    requested_stt_model: row.requested_stt_model ?? undefined,
    processing_job_id: row.processing_job_id,
    processing_error: row.processing_error,
    audio_url: row.audio_url,
    audio_format: row.audio_format,
    audio_duration_ms: row.audio_duration_ms,
    sample_rate: row.sample_rate,
    channels: row.channels,
    status: row.status,
    transcript_id: row.transcript_id,
    stt_status: row.stt_status,
    created_at: row.created_at,
    processed_at: row.processed_at,
    updated_at: row.updated_at,
  };
}

function mapPipelineRow(row: PipelineRow): LecturePipeline {
  return {
    lecture_id: row.lecture_id,
    transcript_status: row.transcript_status,
    summary_status: row.summary_status,
    audio_status: row.audio_status,
    transcript_id: row.transcript_id,
    note_id: row.note_id,
    extraction_id: row.extraction_id,
    updated_at: row.updated_at,
  };
}

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

export function createMediaRepository(db: D1Database): MediaRepository {
  const repository: MediaRepository = {
    async getLectureTranscript(lectureId: string): Promise<LectureTranscript | undefined> {
      const row = await db
        .prepare('SELECT * FROM lecture_transcripts WHERE lecture_id = ? ORDER BY created_at DESC LIMIT 1')
        .bind(lectureId)
        .first<TranscriptRow>();
      return row ? mapTranscriptRow(row) : undefined;
    },
    async listLectureTranscripts(lectureId: string): Promise<LectureTranscript[]> {
      const rows = await db
        .prepare('SELECT * FROM lecture_transcripts WHERE lecture_id = ? ORDER BY created_at DESC')
        .bind(lectureId)
        .all<TranscriptRow>();
      return rows.results.map(mapTranscriptRow);
    },
    async createLectureTranscript(
      userId: string,
      input: TranscriptCreateRequest,
    ): Promise<{ transcript: LectureTranscript; pipeline: LecturePipeline } | null> {
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
      const wordCount = input.word_count ?? fullText.split(/\s+/).filter(Boolean).length;
      const transcript: LectureTranscript = {
        id: createId('trs'),
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

      await db.prepare(
        'INSERT INTO lecture_transcripts (id, lecture_id, user_id, language, full_text, segments_json, word_count, duration_ms, stt_provider, stt_model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          transcript.id,
          transcript.lecture_id,
          transcript.user_id,
          transcript.language,
          transcript.full_text,
          JSON.stringify(transcript.segments),
          transcript.word_count,
          transcript.duration_ms,
          transcript.stt_provider,
          transcript.stt_model,
          transcript.created_at,
        )
        .run();

      const pipeline = await repository.upsertPipeline({
        lecture_id: lecture.id,
        transcript_status: 'COMPLETED',
        transcript_id: transcript.id,
      });

      return { transcript, pipeline };
    },
    async listLectureNotes(lectureId: string): Promise<LectureNote[]> {
      const rows = await db
        .prepare('SELECT * FROM lecture_notes WHERE lecture_id = ? ORDER BY created_at DESC')
        .bind(lectureId)
        .all<NoteRow>();
      return rows.results.map(mapNoteRow);
    },
    async createLectureSummaryNote(
      userId: string,
      input: MediaSummaryRequest,
    ): Promise<{ note: LectureNote; pipeline: LecturePipeline; keyConcepts: string[]; keywords: string[] } | null> {
      const lecture = findLecture(input.lecture_id);
      if (!lecture) {
        return null;
      }

      const transcript = await repository.getLectureTranscript(lecture.id);
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

      const note: LectureNote = {
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
      };

      await db.prepare(
        'INSERT INTO lecture_notes (id, lecture_id, user_id, note_type, title, content, key_concepts_json, keywords_json, timestamps_json, language, ai_model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          note.id,
          note.lecture_id,
          note.user_id,
          note.note_type,
          note.title,
          note.content,
          JSON.stringify(note.key_concepts),
          JSON.stringify(note.keywords),
          note.timestamps ? JSON.stringify(note.timestamps) : null,
          note.language,
          note.ai_model,
          note.created_at,
        )
        .run();

      const pipeline = await repository.upsertPipeline({
        lecture_id: lecture.id,
        summary_status: 'COMPLETED',
        note_id: note.id,
      });

      return { note, pipeline, keyConcepts, keywords };
    },
    async listAudioExtractions(lectureId: string): Promise<AudioExtraction[]> {
      const rows = await db
        .prepare('SELECT * FROM audio_extractions WHERE lecture_id = ? ORDER BY created_at DESC')
        .bind(lectureId)
        .all<ExtractionRow>();
      return rows.results.map(mapExtractionRow);
    },
    async getAudioExtraction(extractionId: string): Promise<AudioExtraction | undefined> {
      const row = await db.prepare('SELECT * FROM audio_extractions WHERE id = ? LIMIT 1').bind(extractionId).first<ExtractionRow>();
      return row ? mapExtractionRow(row) : undefined;
    },
    async createAudioExtraction(
      userId: string,
      input: AudioExtractionRequest,
    ): Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null> {
      const lecture = findLecture(input.lecture_id);
      if (!lecture) {
        return null;
      }

      const existingTranscript = await repository.getLectureTranscript(lecture.id);
      const extraction: AudioExtraction = {
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
        created_at: now(),
        processed_at: input.audio_url ? now() : null,
        updated_at: now(),
      };

      await db.prepare(
        'INSERT INTO audio_extractions (id, lecture_id, user_id, source_type, source_url, source_video_key, source_video_name, source_content_type, source_size_bytes, language, requested_stt_provider, requested_stt_model, processing_job_id, processing_error, audio_url, audio_format, audio_duration_ms, sample_rate, channels, status, transcript_id, stt_status, created_at, processed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          extraction.id,
          extraction.lecture_id,
          extraction.user_id,
          extraction.source_type,
          extraction.source_url,
          extraction.source_video_key ?? null,
          extraction.source_video_name ?? null,
          extraction.source_content_type ?? null,
          extraction.source_size_bytes ?? null,
          extraction.language ?? null,
          extraction.requested_stt_provider ?? null,
          extraction.requested_stt_model ?? null,
          extraction.processing_job_id ?? null,
          extraction.processing_error ?? null,
          extraction.audio_url ?? null,
          extraction.audio_format,
          extraction.audio_duration_ms,
          extraction.sample_rate,
          extraction.channels,
          extraction.status,
          extraction.transcript_id ?? null,
          extraction.stt_status,
          extraction.created_at,
          extraction.processed_at ?? null,
          extraction.updated_at,
        )
        .run();

      const pipeline = await repository.upsertPipeline({
        lecture_id: lecture.id,
        audio_status: extraction.status,
        extraction_id: extraction.id,
      });

      return { extraction, pipeline };
    },
    async updateAudioExtraction(
      input: AudioExtractionCallbackRequest & {
        transcript_id?: string | null;
        stt_status?: AudioExtraction['stt_status'];
      },
    ): Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null> {
      const current = await repository.getAudioExtraction(input.extraction_id);
      if (!current || current.lecture_id !== input.lecture_id) {
        return null;
      }

      const nextStatus = input.status;
      const next: AudioExtraction = {
        ...current,
        processing_job_id: input.processing_job_id ?? current.processing_job_id ?? null,
        processing_error: input.error_message ?? (nextStatus === 'FAILED' ? '오디오 추출에 실패했습니다.' : null),
        audio_url: input.audio_url ?? current.audio_url ?? null,
        audio_format: input.audio_format ?? (input.audio_url ? inferAudioFormat(input.audio_url) : current.audio_format),
        audio_duration_ms: input.audio_duration_ms ?? current.audio_duration_ms,
        sample_rate: input.sample_rate ?? current.sample_rate,
        channels: input.channels ?? current.channels,
        status: nextStatus,
        transcript_id: input.transcript_id ?? current.transcript_id,
        stt_status:
          input.stt_status ??
          (nextStatus === 'FAILED'
            ? 'FAILED'
            : input.transcript_id
              ? 'COMPLETED'
              : current.stt_status),
        processed_at: nextStatus === 'COMPLETED' ? now() : current.processed_at ?? null,
        updated_at: now(),
      };

      await db.prepare(
        'UPDATE audio_extractions SET processing_job_id = ?, processing_error = ?, audio_url = ?, audio_format = ?, audio_duration_ms = ?, sample_rate = ?, channels = ?, status = ?, transcript_id = ?, stt_status = ?, processed_at = ?, updated_at = ? WHERE id = ?',
      )
        .bind(
          next.processing_job_id ?? null,
          next.processing_error ?? null,
          next.audio_url ?? null,
          next.audio_format,
          next.audio_duration_ms,
          next.sample_rate,
          next.channels,
          next.status,
          next.transcript_id ?? null,
          next.stt_status,
          next.processed_at ?? null,
          next.updated_at,
          next.id,
        )
        .run();

      const pipeline = await repository.upsertPipeline({
        lecture_id: next.lecture_id,
        audio_status: next.status,
        extraction_id: next.id,
        transcript_status: next.transcript_id ? 'COMPLETED' : next.stt_status,
        transcript_id: next.transcript_id,
      });

      return { extraction: next, pipeline };
    },
    async getLecturePipeline(lectureId: string): Promise<LecturePipeline> {
      const row = await db.prepare('SELECT * FROM lecture_pipelines WHERE lecture_id = ? LIMIT 1').bind(lectureId).first<PipelineRow>();
      if (row) {
        return mapPipelineRow(row);
      }

      const transcript = await repository.getLectureTranscript(lectureId);
      const notes = await repository.listLectureNotes(lectureId);
      const extractions = await repository.listAudioExtractions(lectureId);
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
    async upsertPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): Promise<LecturePipeline> {
      const current = await repository.getLecturePipeline(partial.lecture_id);
      const next: LecturePipeline = {
        ...current,
        ...partial,
        updated_at: now(),
      };

      await db.prepare(
        'INSERT INTO lecture_pipelines (lecture_id, transcript_status, summary_status, audio_status, transcript_id, note_id, extraction_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(lecture_id) DO UPDATE SET transcript_status = excluded.transcript_status, summary_status = excluded.summary_status, audio_status = excluded.audio_status, transcript_id = excluded.transcript_id, note_id = excluded.note_id, extraction_id = excluded.extraction_id, updated_at = excluded.updated_at',
      )
        .bind(
          next.lecture_id,
          next.transcript_status,
          next.summary_status,
          next.audio_status,
          next.transcript_id ?? null,
          next.note_id ?? null,
          next.extraction_id ?? null,
          next.updated_at,
        )
        .run();

      return next;
    },
  };

  return repository;
}
