import { demoLecturePipelines, demoLectures } from '../../data/demo-data';
import type { Lecture, LecturePipeline } from '../../types';

export function now(): string {
  return new Date().toISOString();
}

export function findLecture(lectureId: string): Lecture | undefined {
  return demoLectures.find((lecture) => lecture.id === lectureId);
}

export function createId(prefix: string, itemsLength: number): string {
  return `${prefix}_${String(itemsLength + 1).padStart(3, '0')}`;
}

export function getPipelineIndex(lectureId: string): number {
  return demoLecturePipelines.findIndex((item) => item.lecture_id === lectureId);
}

export function upsertPipeline(partial: Partial<LecturePipeline> & { lecture_id: string }): LecturePipeline {
  const existingIndex = getPipelineIndex(partial.lecture_id);
  const base: LecturePipeline =
    existingIndex >= 0
      ? {
          lecture_id: partial.lecture_id,
          transcript_status: demoLecturePipelines[existingIndex]?.transcript_status ?? 'PENDING',
          summary_status: demoLecturePipelines[existingIndex]?.summary_status ?? 'PENDING',
          audio_status: demoLecturePipelines[existingIndex]?.audio_status ?? 'PENDING',
          transcript_id: demoLecturePipelines[existingIndex]?.transcript_id ?? null,
          note_id: demoLecturePipelines[existingIndex]?.note_id ?? null,
          extraction_id: demoLecturePipelines[existingIndex]?.extraction_id ?? null,
          updated_at: demoLecturePipelines[existingIndex]?.updated_at ?? now(),
        }
      : {
          lecture_id: partial.lecture_id,
          transcript_status: 'PENDING',
          summary_status: 'PENDING',
          audio_status: 'PENDING',
          transcript_id: null,
          note_id: null,
          extraction_id: null,
          updated_at: now(),
        };

  const next: LecturePipeline = {
    ...base,
    ...partial,
    updated_at: now(),
  };

  if (existingIndex >= 0) {
    demoLecturePipelines[existingIndex] = next;
  } else {
    demoLecturePipelines.push(next);
  }

  return next;
}
