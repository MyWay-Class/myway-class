import type {
  Enrollment,
  LectureProgress,
  Material,
  Notice,
} from '@myway/shared';
import type { ExtractionRow, NoteRow, PipelineRow, TranscriptRow } from './media-repository-mappers';
import {
  mapExtractionRow,
  mapNoteRow,
  mapPipelineRow,
  mapTranscriptRow,
} from './media-repository-mappers';

export type MaterialRow = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type NoticeRow = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  pinned: number;
  author_id: string;
  created_at: string;
};

export type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percent: number;
  created_at: string | null;
  updated_at: string;
};

export type LectureProgressRow = {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: number;
  completed_at: string | null;
  updated_at: string | null;
};

export type { ExtractionRow, NoteRow, PipelineRow, TranscriptRow };

function toBoolean(value: number): boolean {
  return value === 1;
}

export function mapMaterialRow(row: MaterialRow): Material {
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    summary: row.summary,
    file_name: row.file_name,
    uploaded_by: row.uploaded_by,
    uploaded_at: row.uploaded_at,
  };
}

export function mapNoticeRow(row: NoticeRow): Notice {
  return {
    id: row.id,
    course_id: row.course_id,
    title: row.title,
    content: row.content,
    pinned: toBoolean(row.pinned),
    author_id: row.author_id,
    created_at: row.created_at,
  };
}

export function mapEnrollmentRow(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    status: row.status as Enrollment['status'],
    progress_percent: row.progress_percent,
    created_at: row.created_at ?? undefined,
  };
}

export function mapLectureProgressRow(row: LectureProgressRow): LectureProgress {
  return {
    id: row.id,
    user_id: row.user_id,
    lecture_id: row.lecture_id,
    is_completed: toBoolean(row.is_completed),
    completed_at: row.completed_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}
export { mapExtractionRow, mapNoteRow, mapPipelineRow, mapTranscriptRow };
