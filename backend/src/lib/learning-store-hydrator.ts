import type { D1Database } from '@cloudflare/workers-types';
import type { CourseDetail, Lecture, LecturePipeline } from '@myway/shared';
import {
  mapEnrollmentRow,
  mapExtractionRow,
  mapLectureProgressRow,
  mapMaterialRow,
  mapNoteRow,
  mapNoticeRow,
  mapPipelineRow,
  mapTranscriptRow,
  type EnrollmentRow,
  type ExtractionRow,
  type LectureProgressRow,
  type MaterialRow,
  type NoteRow,
  type NoticeRow,
  type PipelineRow,
  type TranscriptRow,
} from './learning-store-mappers';

export type CourseRow = {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  is_published: number;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

export type LectureRow = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  week_number: number | null;
  session_number: number | null;
  content_type: string;
  content_text: string;
  duration_minutes: number;
  is_published: number;
  video_url?: string | null;
  video_asset_key?: string | null;
  created_at: string;
  updated_at: string;
};

function parseTags(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function ensureLectureContentType(value: string): Lecture['content_type'] {
  return value === 'text' ? 'text' : 'video';
}

function toBoolean(value: number): boolean {
  return value === 1;
}

function upsertById<T extends { id: string }>(items: T[], item: T): void {
  const index = items.findIndex((current) => current.id === item.id);
  if (index >= 0) {
    items[index] = item;
    return;
  }
  items.push(item);
}

function upsertPipelineByLectureId(items: LecturePipeline[], item: LecturePipeline): void {
  const index = items.findIndex((current) => current.lecture_id === item.lecture_id);
  if (index >= 0) {
    items[index] = item;
    return;
  }
  items.push(item);
}

function mapLectureRow(row: LectureRow, demoLectures: Lecture[]): Lecture {
  const lecture = demoLectures.find((item) => item.id === row.id);
  return {
    ...(lecture ?? {
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      order_index: row.order_index,
      week_number: row.week_number ?? undefined,
      session_number: row.session_number ?? undefined,
      content_type: ensureLectureContentType(row.content_type),
      content_text: row.content_text,
      duration_minutes: row.duration_minutes,
      is_published: toBoolean(row.is_published),
    }),
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    order_index: row.order_index,
    week_number: row.week_number ?? undefined,
    session_number: row.session_number ?? undefined,
    content_type: ensureLectureContentType(row.content_type),
    content_text: row.content_text,
    duration_minutes: row.duration_minutes,
    is_published: toBoolean(row.is_published),
    video_url: row.video_url ?? undefined,
    video_asset_key: row.video_asset_key ?? undefined,
  };
}

export async function hydrateLearningStoreMemory(
  db: D1Database,
  memory: {
    demoCourses: Array<{
      id: string;
      instructor_id: string;
      title: string;
      description: string;
      category: string;
      difficulty: CourseDetail['difficulty'];
      is_published: boolean;
      tags: string[];
    }>;
    demoLectures: Lecture[];
    demoMaterials: any[];
    demoNotices: any[];
    demoEnrollments: any[];
    demoLectureProgress: any[];
    demoLectureTranscripts: any[];
    demoLectureNotes: any[];
    demoAudioExtractions: any[];
    demoLecturePipelines: LecturePipeline[];
  },
): Promise<void> {
  const [courseRows, lectureRows, materialRows, noticeRows, enrollmentRows, progressRows, transcriptRows, noteRows, extractionRows, pipelineRows] = await Promise.all([
    db.prepare('SELECT * FROM courses ORDER BY created_at ASC, id ASC').all<CourseRow>(),
    db.prepare('SELECT * FROM lectures ORDER BY course_id ASC, order_index ASC, id ASC').all<LectureRow>(),
    db.prepare('SELECT * FROM course_materials ORDER BY uploaded_at DESC, id ASC').all<MaterialRow>(),
    db.prepare('SELECT * FROM course_notices ORDER BY pinned DESC, created_at DESC, id ASC').all<NoticeRow>(),
    db.prepare('SELECT * FROM enrollments ORDER BY created_at ASC, id ASC').all<EnrollmentRow>(),
    db.prepare('SELECT * FROM lecture_progress ORDER BY updated_at DESC, id ASC').all<LectureProgressRow>(),
    db.prepare('SELECT * FROM lecture_transcripts ORDER BY created_at ASC, id ASC').all<TranscriptRow>(),
    db.prepare('SELECT * FROM lecture_notes ORDER BY created_at ASC, id ASC').all<NoteRow>(),
    db.prepare('SELECT * FROM audio_extractions ORDER BY created_at ASC, id ASC').all<ExtractionRow>(),
    db.prepare('SELECT * FROM lecture_pipelines ORDER BY updated_at ASC, lecture_id ASC').all<PipelineRow>(),
  ]);

  for (const row of courseRows.results) {
    upsertById(memory.demoCourses, {
      id: row.id,
      instructor_id: row.instructor_id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty as CourseDetail['difficulty'],
      is_published: toBoolean(row.is_published),
      tags: parseTags(row.tags_json),
    });
  }
  for (const row of lectureRows.results) upsertById(memory.demoLectures, mapLectureRow(row, memory.demoLectures));
  for (const row of materialRows.results) upsertById(memory.demoMaterials, mapMaterialRow(row));
  for (const row of noticeRows.results) upsertById(memory.demoNotices, mapNoticeRow(row));
  for (const row of enrollmentRows.results) upsertById(memory.demoEnrollments, mapEnrollmentRow(row));
  for (const row of progressRows.results) upsertById(memory.demoLectureProgress, mapLectureProgressRow(row));
  for (const row of transcriptRows.results) upsertById(memory.demoLectureTranscripts, mapTranscriptRow(row));
  for (const row of noteRows.results) upsertById(memory.demoLectureNotes, mapNoteRow(row));
  for (const row of extractionRows.results) upsertById(memory.demoAudioExtractions, mapExtractionRow(row));
  for (const row of pipelineRows.results) upsertPipelineByLectureId(memory.demoLecturePipelines, mapPipelineRow(row));
}
