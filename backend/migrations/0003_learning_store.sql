CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  is_published INTEGER NOT NULL,
  tags_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id
  ON courses(instructor_id);

CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  week_number INTEGER,
  session_number INTEGER,
  content_type TEXT NOT NULL,
  content_text TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_published INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lectures_course_id_order
  ON lectures(course_id, order_index);

CREATE TABLE IF NOT EXISTS course_materials (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course_id_uploaded_at
  ON course_materials(course_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS course_notices (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned INTEGER NOT NULL,
  author_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_notices_course_id_created_at
  ON course_notices(course_id, created_at DESC);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  status TEXT NOT NULL,
  progress_percent INTEGER NOT NULL,
  created_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id
  ON enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
  ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS lecture_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  lecture_id TEXT NOT NULL,
  is_completed INTEGER NOT NULL,
  completed_at TEXT,
  updated_at TEXT,
  UNIQUE(user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_user_id
  ON lecture_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_lecture_progress_lecture_id
  ON lecture_progress(lecture_id);
