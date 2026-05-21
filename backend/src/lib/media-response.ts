import type { AudioExtraction, LecturePipeline } from '@myway/shared';

export function buildExtractionResponse(extraction: AudioExtraction, pipeline: LecturePipeline): Record<string, unknown> {
  return {
    extraction_id: extraction.id,
    lecture_id: extraction.lecture_id,
    audio_format: extraction.audio_format,
    audio_duration_ms: extraction.audio_duration_ms,
    sample_rate: extraction.sample_rate,
    channels: extraction.channels,
    status: extraction.status,
    transcript_id: extraction.transcript_id,
    audio_url: extraction.audio_url,
    video_url: extraction.source_url,
    video_asset_key: extraction.source_video_key,
    processing_job_id: extraction.processing_job_id,
    processing_error: extraction.processing_error,
    pipeline,
  };
}

export function buildExtractionCallbackResponse(extraction: AudioExtraction, pipeline: LecturePipeline): Record<string, unknown> {
  return {
    extraction_id: extraction.id,
    lecture_id: extraction.lecture_id,
    status: extraction.status,
    audio_url: extraction.audio_url,
    transcript_id: extraction.transcript_id,
    processing_job_id: extraction.processing_job_id,
    processing_error: extraction.processing_error,
    pipeline,
  };
}
