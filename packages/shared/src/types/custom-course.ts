export type CustomCourseStatus = 'DRAFT' | 'COMPOSING' | 'READY' | 'SHARED' | 'COPIED' | 'ARCHIVED';

export type CustomCourseClip = {
  id: string;
  custom_course_id: string;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  order_index: number;
  source_video_url: string;
};

export type CustomCourse = {
  id: string;
  course_id: string;
  owner_id: string;
  title: string;
  description: string;
  status: CustomCourseStatus;
  source_lecture_ids: string[];
  clip_count: number;
  total_duration_ms: number;
  share_count: number;
  copy_count: number;
  copied_from_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomCourseShare = {
  id: string;
  custom_course_id: string;
  course_id: string;
  shared_by: string;
  visibility: 'course';
  message: string | null;
  created_at: string;
};

export type CustomCourseComposeClipRequest = {
  lecture_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label?: string;
  description?: string;
};

export type CustomCourseComposeRequest = {
  course_id: string;
  title: string;
  description?: string;
  clips: CustomCourseComposeClipRequest[];
};

export type CustomCourseShareRequest = {
  message?: string;
};

export type CustomCourseCopyRequest = {
  custom_course_id: string;
  title?: string;
  description?: string;
};

export type CustomCourseDetail = CustomCourse & {
  clips: CustomCourseClip[];
  shares: CustomCourseShare[];
};

export type CustomCourseCommunityItem = CustomCourseDetail & {
  shared_by_name: string;
  course_title: string;
  is_copied_by_user: boolean;
};

export type CustomCourseLibraryItem = CustomCourseDetail & {
  ownership: 'owned' | 'copied';
};
