import type { D1Database } from '@cloudflare/workers-types';
import type { BootstrapSeedData } from './learning-store-bootstrap';

export async function seedLearningStoreMediaData(db: D1Database, seed: BootstrapSeedData): Promise<void> {
  if (seed.transcripts.length === 0 && seed.notes.length === 0 && seed.extractions.length === 0 && seed.pipelines.length === 0) return;

  const lectureIds = new Set<string>([
    ...seed.transcripts.map((item) => item.lecture_id),
    ...seed.notes.map((item) => item.lecture_id),
    ...seed.extractions.map((item) => item.lecture_id),
    ...seed.pipelines.map((item) => item.lecture_id),
  ]);

  for (const lectureId of lectureIds) {
    await Promise.all([
      db.prepare('DELETE FROM lecture_transcripts WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_notes WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM audio_extractions WHERE lecture_id = ?').bind(lectureId).run(),
      db.prepare('DELETE FROM lecture_pipelines WHERE lecture_id = ?').bind(lectureId).run(),
    ]);
  }

  for (const transcript of seed.transcripts) {
    await db
      .prepare(
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
  }

  for (const note of seed.notes) {
    await db
      .prepare(
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
  }

  for (const extraction of seed.extractions) {
    await db
      .prepare(
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
  }

  for (const pipeline of seed.pipelines) {
    await db
      .prepare(
        'INSERT INTO lecture_pipelines (lecture_id, transcript_status, summary_status, audio_status, transcript_id, note_id, extraction_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(lecture_id) DO UPDATE SET transcript_status = excluded.transcript_status, summary_status = excluded.summary_status, audio_status = excluded.audio_status, transcript_id = excluded.transcript_id, note_id = excluded.note_id, extraction_id = excluded.extraction_id, updated_at = excluded.updated_at',
      )
      .bind(
        pipeline.lecture_id,
        pipeline.transcript_status,
        pipeline.summary_status,
        pipeline.audio_status,
        pipeline.transcript_id ?? null,
        pipeline.note_id ?? null,
        pipeline.extraction_id ?? null,
        pipeline.updated_at,
      )
      .run();
  }
}
