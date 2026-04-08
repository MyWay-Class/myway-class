import { demoLecturePipelines } from '../../data/demo-data';
import type { LecturePipeline } from '../../types';
import { getLectureTranscript } from './transcript';
import { listAudioExtractions } from './audio';
import { listLectureNotes } from './summary';
import { now } from './helpers';

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

export function buildPipelineOverview(lectureId: string): LecturePipeline {
  return getLecturePipeline(lectureId);
}
