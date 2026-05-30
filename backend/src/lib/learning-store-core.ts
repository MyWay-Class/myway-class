import type { D1Database } from '@cloudflare/workers-types';
import { demoCourses, demoEnrollments, demoLectureProgress, demoLectures } from '@myway/shared/data/courses';
import { demoAudioExtractions, demoLectureNotes, demoLecturePipelines, demoLectureTranscripts, demoMaterials, demoNotices } from '@myway/shared/data/media';
import type {
  AudioExtraction,
  CourseDetail,
  Enrollment,
  Lecture,
  LectureNote,
  LecturePipeline,
  LectureProgress,
  LectureTranscript,
  Material,
  Notice,
} from '@myway/shared';
import type { RuntimeBindings } from './runtime-env';
import {
  ensureLearningStoreSchema,
  seedLearningStoreCourseData,
  seedLearningStoreMediaData,
} from './learning-store-bootstrap';
import { hydrateLearningStoreMemory } from './learning-store-hydrator';
import {
  persistCourseDetailToDb,
  persistEnrollmentToDb,
  persistLectureVideoAssetToDb,
  persistProgressAndEnrollmentToDb,
  updateLectureDuration,
} from './learning-store-persistence';

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

type TranscriptDurationRow = {
  lecture_id: string;
  duration_ms: number;
  created_at: string;
};

type ExtractionDurationRow = {
  lecture_id: string;
  audio_duration_ms: number;
  created_at: string;
};


let learningStoreReady = false;
let learningStorePromise: Promise<void> | null = null;

function toBoolean(value: number): boolean {
  return value === 1;
}


function resolveDurationMinutes(durationMs: number): number {
  return Math.max(1, Math.ceil(durationMs / 60_000));
}

function resetMemoryState(): void {
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

function syncLectureDurationMemory(lectureId: string, durationMinutes: number): void {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (lecture) {
    lecture.duration_minutes = durationMinutes;
  }
}

function learningStoreSeedState() {
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

async function syncLectureDurationsFromMedia(db: D1Database): Promise<void> {
  const [transcriptRows, extractionRows] = await Promise.all([
    db
      .prepare('SELECT lecture_id, duration_ms, created_at FROM lecture_transcripts ORDER BY created_at DESC, id DESC')
      .all<TranscriptDurationRow>(),
    db
      .prepare('SELECT lecture_id, audio_duration_ms, created_at FROM audio_extractions ORDER BY created_at DESC, id DESC')
      .all<ExtractionDurationRow>(),
  ]);

  const resolved = new Map<string, number>();

  for (const row of transcriptRows.results) {
    if (resolved.has(row.lecture_id) || row.duration_ms <= 0) {
      continue;
    }

    resolved.set(row.lecture_id, resolveDurationMinutes(row.duration_ms));
  }

  for (const row of extractionRows.results) {
    if (resolved.has(row.lecture_id) || row.audio_duration_ms <= 0) {
      continue;
    }

    resolved.set(row.lecture_id, resolveDurationMinutes(row.audio_duration_ms));
  }

  for (const [lectureId, durationMinutes] of resolved.entries()) {
    await updateLectureDuration(db, lectureId, durationMinutes);
    syncLectureDurationMemory(lectureId, durationMinutes);
  }
}

async function bootstrapLearningStore(db: D1Database): Promise<void> {
  await ensureLearningStoreSchema(db);
  const seedState = learningStoreSeedState();
  await seedLearningStoreCourseData(db, seedState);
  await seedLearningStoreMediaData(db, seedState);
  await hydrateLearningStoreMemory(db, {
    demoCourses,
    demoLectures,
    demoMaterials,
    demoNotices,
    demoEnrollments,
    demoLectureProgress,
    demoLectureTranscripts,
    demoLectureNotes,
    demoAudioExtractions,
    demoLecturePipelines,
  });
  await syncLectureDurationsFromMedia(db);
  learningStoreReady = true;
}

function createLearningStorePromise(db: D1Database): Promise<void> {
  return bootstrapLearningStore(db).catch((error) => {
    learningStorePromise = null;
    throw error;
  });
}





export async function ensureLearningStore(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  if (learningStoreReady) {
    return;
  }

  if (!learningStorePromise) {
    learningStorePromise = createLearningStorePromise(db);
  }

  await learningStorePromise;
}

export async function reloadLearningStore(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  learningStoreReady = false;
  learningStorePromise = null;
  await ensureLearningStore(env);
}

export async function refreshLearningStoreFromDatabase(env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  learningStoreReady = false;
  learningStorePromise = null;
  resetMemoryState();

  if (!learningStorePromise) {
    learningStorePromise = createLearningStorePromise(db);
  }

  await learningStorePromise;
}

export async function persistCourseDetail(detail: CourseDetail, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await persistCourseDetailToDb(db, detail);
}

export async function persistEnrollment(enrollment: Enrollment, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await persistEnrollmentToDb(db, enrollment);
}

export async function persistLectureProgress(userId: string, lectureId: string, env?: RuntimeBindings): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);

  const progress = demoLectureProgress.find((item) => item.user_id === userId && item.lecture_id === lectureId);
  const enrollment = demoEnrollments.find((item) => item.user_id === userId && item.course_id === demoLectures.find((lecture) => lecture.id === lectureId)?.course_id);
  await persistProgressAndEnrollmentToDb(db, progress, enrollment);
}

export async function persistLectureVideoAsset(
  lectureId: string,
  videoUrl: string,
  videoAssetKey: string,
  env?: RuntimeBindings,
): Promise<void> {
  const db = env?.MEDIA_DB;
  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await persistLectureVideoAssetToDb(db, lectureId, videoUrl, videoAssetKey);

  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (lecture) {
    lecture.video_url = videoUrl;
    lecture.video_asset_key = videoAssetKey;
  }
}

export async function persistLectureDuration(
  lectureId: string,
  durationMinutes: number,
  env?: RuntimeBindings,
): Promise<void> {
  const normalizedDuration = Math.max(1, Math.round(durationMinutes));
  const db = env?.MEDIA_DB;
  syncLectureDurationMemory(lectureId, normalizedDuration);

  if (!db) {
    return;
  }

  await ensureLearningStore(env);
  await updateLectureDuration(db, lectureId, normalizedDuration);
}
