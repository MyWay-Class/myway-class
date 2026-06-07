import type { D1Database } from '@cloudflare/workers-types';
import type { AudioExtraction, LectureNote, LecturePipeline, LectureTranscript } from '@myway/shared';
import { now } from '@myway/shared/lms/media/helpers';
import { mapExtractionRow, mapNoteRow, mapPipelineRow, mapTranscriptRow, type ExtractionRow, type NoteRow, type PipelineRow, type TranscriptRow } from './media-repository-mappers';

type Awaitable<T> = T | Promise<T>;

export async function getLectureTranscript(db: D1Database, lectureId: string): Promise<LectureTranscript | undefined> {
  const row = await db
    .prepare('SELECT * FROM lecture_transcripts WHERE lecture_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(lectureId)
    .first<TranscriptRow>();
  return row ? mapTranscriptRow(row) : undefined;
}

export async function listLectureTranscripts(db: D1Database, lectureId: string): Promise<LectureTranscript[]> {
  const rows = await db
    .prepare('SELECT * FROM lecture_transcripts WHERE lecture_id = ? ORDER BY created_at DESC')
    .bind(lectureId)
    .all<TranscriptRow>();
  return rows.results.map(mapTranscriptRow);
}

export async function listLectureNotes(db: D1Database, lectureId: string): Promise<LectureNote[]> {
  const rows = await db
    .prepare('SELECT * FROM lecture_notes WHERE lecture_id = ? ORDER BY created_at DESC')
    .bind(lectureId)
    .all<NoteRow>();
  return rows.results.map(mapNoteRow);
}

export async function listAudioExtractions(db: D1Database, lectureId: string): Promise<AudioExtraction[]> {
  const rows = await db
    .prepare('SELECT * FROM audio_extractions WHERE lecture_id = ? ORDER BY created_at DESC')
    .bind(lectureId)
    .all<ExtractionRow>();
  return rows.results.map(mapExtractionRow);
}

export async function getAudioExtraction(db: D1Database, extractionId: string): Promise<AudioExtraction | undefined> {
  const row = await db.prepare('SELECT * FROM audio_extractions WHERE id = ? LIMIT 1').bind(extractionId).first<ExtractionRow>();
  return row ? mapExtractionRow(row) : undefined;
}

export async function getLecturePipeline(
  db: D1Database,
  lectureId: string,
  readers: {
    getLectureTranscript: (lectureId: string) => Awaitable<LectureTranscript | undefined>;
    listLectureNotes: (lectureId: string) => Awaitable<LectureNote[]>;
    listAudioExtractions: (lectureId: string) => Awaitable<AudioExtraction[]>;
  },
): Promise<LecturePipeline> {
  const row = await db.prepare('SELECT * FROM lecture_pipelines WHERE lecture_id = ? LIMIT 1').bind(lectureId).first<PipelineRow>();
  if (row) {
    return mapPipelineRow(row);
  }

  const transcript = await readers.getLectureTranscript(lectureId);
  const notes = await readers.listLectureNotes(lectureId);
  const extractions = await readers.listAudioExtractions(lectureId);
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
}
