import type { LecturePipeline, LectureTranscript, TranscriptCreateRequest } from '../../types';
import { memoryMediaRepository, type MediaRepository } from './store';

export async function getLectureTranscript(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LectureTranscript | undefined> {
  return await repository.getLectureTranscript(lectureId);
}

export async function listLectureTranscripts(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LectureTranscript[]> {
  return await repository.listLectureTranscripts(lectureId);
}

export async function createLectureTranscript(
  userId: string,
  input: TranscriptCreateRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<{ transcript: LectureTranscript; pipeline: LecturePipeline } | null> {
  return await repository.createLectureTranscript(userId, input);
}
