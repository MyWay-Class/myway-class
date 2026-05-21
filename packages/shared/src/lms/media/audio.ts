import type {
  AudioExtraction,
  AudioExtractionCallbackRequest,
  AudioExtractionRequest,
  LecturePipeline,
} from '../../types';
import { memoryMediaRepository, type MediaRepository } from './store';

export async function listAudioExtractions(
  lectureId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AudioExtraction[]> {
  return await repository.listAudioExtractions(lectureId);
}

export async function getAudioExtraction(
  extractionId: string,
  repository: MediaRepository = memoryMediaRepository,
): Promise<AudioExtraction | undefined> {
  return await repository.getAudioExtraction(extractionId);
}

export async function createAudioExtraction(
  userId: string,
  input: AudioExtractionRequest,
  repository: MediaRepository = memoryMediaRepository,
): Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null> {
  return await repository.createAudioExtraction(userId, input);
}

export async function updateAudioExtraction(
  input: AudioExtractionCallbackRequest & {
    transcript_id?: string | null;
    stt_status?: AudioExtraction['stt_status'];
  },
  repository: MediaRepository = memoryMediaRepository,
): Promise<{ extraction: AudioExtraction; pipeline: LecturePipeline } | null> {
  return await repository.updateAudioExtraction(input);
}
