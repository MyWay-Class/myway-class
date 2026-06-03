import type { D1Database } from '@cloudflare/workers-types';
import type { LecturePipeline, MediaRepository } from '@myway/shared';
import { getLecturePipeline } from './media-repository-read-ops';

type MediaReader = Pick<MediaRepository, 'getLectureTranscript' | 'listLectureNotes' | 'listAudioExtractions'>;

export async function upsertPipeline(
  db: D1Database,
  repository: MediaReader,
  partial: Partial<LecturePipeline> & { lecture_id: string },
): Promise<LecturePipeline> {
  const current = await getLecturePipeline(db, partial.lecture_id, repository);
  const next: LecturePipeline = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
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
}
