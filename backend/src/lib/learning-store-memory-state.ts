import { demoCourses, demoEnrollments, demoLectureProgress, demoLectures } from '@myway/shared/data/courses';
import { demoAudioExtractions, demoLectureNotes, demoLecturePipelines, demoLectureTranscripts, demoMaterials, demoNotices } from '@myway/shared/data/media';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const seedDemoCourses = clone(demoCourses);
const seedDemoLectures = clone(demoLectures);
const seedDemoMaterials = clone(demoMaterials);
const seedDemoNotices = clone(demoNotices);
const seedDemoLectureTranscripts = clone(demoLectureTranscripts);
const seedDemoLectureNotes = clone(demoLectureNotes);
const seedDemoAudioExtractions = clone(demoAudioExtractions);
const seedDemoLecturePipelines = clone(demoLecturePipelines);
const seedDemoEnrollments = clone(demoEnrollments);
const seedDemoLectureProgress = clone(demoLectureProgress);

export function resolveDurationMinutes(durationMs: number): number {
  return Math.max(1, Math.ceil(durationMs / 60_000));
}

export function resetMemoryState(): void {
  demoCourses.splice(0, demoCourses.length, ...clone(seedDemoCourses));
  demoLectures.splice(0, demoLectures.length, ...clone(seedDemoLectures));
  demoMaterials.splice(0, demoMaterials.length, ...clone(seedDemoMaterials));
  demoNotices.splice(0, demoNotices.length, ...clone(seedDemoNotices));
  demoLectureTranscripts.splice(0, demoLectureTranscripts.length, ...clone(seedDemoLectureTranscripts));
  demoLectureNotes.splice(0, demoLectureNotes.length, ...clone(seedDemoLectureNotes));
  demoAudioExtractions.splice(0, demoAudioExtractions.length, ...clone(seedDemoAudioExtractions));
  demoLecturePipelines.splice(0, demoLecturePipelines.length, ...clone(seedDemoLecturePipelines));
  demoEnrollments.splice(0, demoEnrollments.length, ...clone(seedDemoEnrollments));
  demoLectureProgress.splice(0, demoLectureProgress.length, ...clone(seedDemoLectureProgress));
}

export function syncLectureDurationMemory(lectureId: string, durationMinutes: number): void {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (lecture) {
    lecture.duration_minutes = durationMinutes;
  }
}

export function learningStoreSeedState() {
  return {
    courses: demoCourses,
    lectures: demoLectures,
    materials: demoMaterials,
    notices: demoNotices,
    enrollments: demoEnrollments,
    progress: demoLectureProgress,
    transcripts: seedDemoLectureTranscripts,
    notes: seedDemoLectureNotes,
    extractions: seedDemoAudioExtractions,
    pipelines: seedDemoLecturePipelines,
  };
}
