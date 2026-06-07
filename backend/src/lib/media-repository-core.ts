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
  getAudioExtraction,
  getLecturePipeline,
  getLectureTranscript,
  listAudioExtractions,
  listLectureNotes,
  listLectureTranscripts,
} from './media-repository-read-ops';
import {
  createAudioExtraction,
  createLectureSummaryNote,
  createLectureTranscript,
  updateAudioExtraction,
} from './media-repository-write-ops';
import { upsertPipeline } from './media-repository-pipeline-ops';

export function createMediaRepository(db: D1Database): MediaRepository {
  const repository: MediaRepository = {
    getLectureTranscript: (lectureId: string) => getLectureTranscript(db, lectureId),
    listLectureTranscripts: (lectureId: string) => listLectureTranscripts(db, lectureId),
    createLectureTranscript: (userId: string, input: TranscriptCreateRequest) =>
      createLectureTranscript(db, userId, input, repository),
    listLectureNotes: (lectureId: string) => listLectureNotes(db, lectureId),
    createLectureSummaryNote: (userId: string, input: MediaSummaryRequest) =>
      createLectureSummaryNote(db, userId, input, repository),
    listAudioExtractions: (lectureId: string) => listAudioExtractions(db, lectureId),
    getAudioExtraction: (extractionId: string) => getAudioExtraction(db, extractionId),
    createAudioExtraction: (userId: string, input: AudioExtractionRequest) =>
      createAudioExtraction(db, userId, input, repository),
    updateAudioExtraction: (input: AudioExtractionCallbackRequest & { transcript_id?: string | null; stt_status?: AudioExtraction['stt_status'] }) =>
      updateAudioExtraction(db, input, repository),
    getLecturePipeline: (lectureId: string) => getLecturePipeline(db, lectureId, repository),
    upsertPipeline: (partial: Partial<LecturePipeline> & { lecture_id: string }) =>
      upsertPipeline(db, repository, partial),
  };

  return repository;
}
