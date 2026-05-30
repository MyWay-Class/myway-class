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
  findLecture,
  now,
} from '@myway/shared/lms/media/helpers';
import {
  applyAudioExtractionCallback,
  buildAudioExtraction,
  buildLectureSummaryNote,
  buildLectureTranscript,
} from './media-repository-builders';
import {
  mapExtractionRow,
  mapNoteRow,
  mapPipelineRow,
  mapTranscriptRow,
  type ExtractionRow,
  type NoteRow,
  type PipelineRow,
  type TranscriptRow,
} from './media-repository-mappers';

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

      const transcript = buildLectureTranscript(lecture, userId, input);
      if (!transcript) {
        return null;
      }

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
      const { note, keyConcepts, keywords } = buildLectureSummaryNote(lecture, userId, input, transcript);

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
      const extraction = buildAudioExtraction(lecture, userId, input, existingTranscript);

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

      const next = applyAudioExtractionCallback(current, input);

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
