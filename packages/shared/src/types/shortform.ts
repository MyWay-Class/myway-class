export type ShortformStyle = 'highlight' | 'exam_prep' | 'quick_review' | 'deep_dive' | 'custom';

export type ShortformStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'PUBLIC' | 'ARCHIVED';

export type ShortformExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ShortformCandidate = {
  id: string;
  extraction_id: string;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  importance: number;
  order_index: number;
  is_selected: boolean;
};

export type ShortformExtraction = {
  id: string;
  user_id: string;
  course_id: string;
  mode: 'single' | 'cross';
  lecture_ids: string[];
  style: ShortformStyle;
  target_duration_sec: number;
  language: string;
  ai_model: string;
  ai_response: string;
  total_candidates: number;
  created_at: string;
};

export type ShortformClip = {
  id: string;
  shortform_id: string;
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

export type ShortformVideo = {
  id: string;
  shortform_id: string;
  user_id: string;
  title: string;
  description: string;
  duration_ms: number;
  total_segments: number;
  course_id: string;
  source_lecture_ids: string[];
  status: ShortformStatus;
  video_url: string;
  export_status: ShortformExportStatus;
  export_job_id: string | null;
  export_result_url: string | null;
  export_failure_reason: string | null;
  export_error_message: string | null;
  export_retry_count: number;
  updated_at: string;
  share_count: number;
  like_count: number;
  save_count: number;
  view_count: number;
  created_at: string;
};

export type ShortformShare = {
  id: string;
  video_id: string;
  course_id: string;
  shared_by: string;
  visibility: 'course';
  message: string | null;
  created_at: string;
};

export type ShortformSave = {
  id: string;
  user_id: string;
  video_id: string;
  note: string | null;
  folder: string;
  created_at: string;
};

export type ShortformLike = {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
};

export type ShortformGenerateRequest = {
  lecture_id?: string;
  course_id: string;
  mode?: 'single' | 'cross';
  style?: ShortformStyle;
  target_duration_sec?: number;
  language?: string;
};

export type ShortformSelectRequest = {
  candidate_ids: string[];
  is_selected: boolean;
};

export type ShortformComposeRequest = {
  extraction_id: string;
  title: string;
  candidate_ids?: string[];
  description?: string;
};

export type ShortformShareRequest = {
  video_id: string;
  course_id: string;
  visibility?: 'course';
  message?: string;
};

export type ShortformSaveRequest = {
  video_id: string;
  note?: string;
  folder?: string;
};

export type ShortformLikeRequest = {
  video_id: string;
};

export type ShortformExtractionDetail = ShortformExtraction & {
  candidates: ShortformCandidate[];
};

export type ShortformVideoDetail = ShortformVideo & {
  clips: ShortformClip[];
};

export type ShortformCommunityItem = ShortformVideoDetail & {
  shared_by_name: string;
  course_title: string;
  is_saved: boolean;
  is_liked: boolean;
};

export type ShortformLibraryItem = ShortformVideoDetail & {
  ownership: 'owned' | 'saved';
  save_note?: string | null;
  save_folder?: string;
  saved_at?: string;
};
