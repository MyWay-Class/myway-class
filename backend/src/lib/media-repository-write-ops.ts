import type { D1Database } from '@cloudflare/workers-types';
import type {
  AudioExtraction,
  AudioExtractionCallbackRequest,
  AudioExtractionRequest,
  LectureNote,
  LecturePipeline,
  LectureTranscript,
  MediaRepository,
  MediaSummaryRequest,
  TranscriptCreateRequest,
} from '@myway/shared';
import { findLecture } from '@myway/shared/lms/media/helpers';
import { applyAudioExtractionCallback, buildAudioExtraction, buildLectureSummaryNote, buildLectureTranscript } from './media-repository-builders';
import { getAudioExtraction } from './media-repository-read-ops';
import { upsertPipeline } from './media-repository-pipeline-ops';

type MediaReader = Pick<MediaRepository, 'getLectureTranscript' | 'listLectureNotes' | 'listAudioExtractions'>;

export async function createLectureTranscript(
  db: D1Database,
  userId: string,
  input: TranscriptCreateRequest,
  repository: MediaReader,
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

  const pipeline = await upsertPipeline(db, repository, {
    lecture_id: lecture.id,
    transcript_status: 'COMPLETED',
    transcript_id: transcript.id,
  });

  return { transcript, pipeline };
}

export async function createLectureSummaryNote(
  db: D1Database,
  userId: string,
  input: MediaSummaryRequest,
  repository: MediaReader,
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

  const pipeline = await upsertPipeline(db, repository, {
    lecture_id: lecture.id,
    summary_status: 'COMPLETED',
    note_id: note.id,
  });

  return { note, pipeline, keyConcepts, keywords };
}

export async function createAudioExtraction(
  db: D1Database,
  userId: string,
  input: AudioExtractionRequest,
  repository: MediaReader,
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

  const pipeline = await upsertPipeline(db, repository, {
    lecture_id: lecture.id,
    audio_status: extraction.status,
    extraction_id: extraction.id,
  });

  return { extraction, pipeline };
}

export async function updateAudioExtraction(
  db: D1Database,
  input: AudioExtractionCallbackRequest & {
    transcript_id?: string | null;
    stt_status?: AudioExtraction['stt_status'];
  },
  repository: MediaReader,
): Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null> {
  const current = await getAudioExtraction(db, input.extraction_id);
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

  const pipeline = await upsertPipeline(db, repository, {
    lecture_id: next.lecture_id,
    audio_status: next.status,
    extraction_id: next.id,
    transcript_status: next.transcript_id ? 'COMPLETED' : next.stt_status,
    transcript_id: next.transcript_id,
  });

  return { extraction: next, pipeline };
}
