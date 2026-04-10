import type { LecturePipeline } from '../../types';
import { memoryMediaRepository, type MediaRepository } from './store';

export async function getLecturePipeline(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LecturePipeline> {
  return await repository.getLecturePipeline(lectureId);
}

export async function buildPipelineOverview(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<LecturePipeline> {
  return await repository.getLecturePipeline(lectureId);
}
