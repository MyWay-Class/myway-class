import type { LectureNote, LecturePipeline, MediaSummaryRequest } from '../../types';
import { memoryMediaRepository, type MediaRepository } from './store';

export async function listLectureNotes(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LectureNote[]> {
  return await repository.listLectureNotes(lectureId);
}

export async function createLectureSummaryNote(
  userId: string,
  input: MediaSummaryRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<
  | { note: LectureNote; pipeline: LecturePipeline; keyConcepts: string[]; keywords: string[] }
  | null
> {
  return await repository.createLectureSummaryNote(userId, input);
}
