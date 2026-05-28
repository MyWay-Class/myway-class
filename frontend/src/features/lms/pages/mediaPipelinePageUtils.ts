import type { AudioExtraction, LectureDetail } from '@myway/shared';
import type { MediaUploadResult } from '../../../lib/api-media';

export function buildDefaultDemoUploadResult(
  lecture: LectureDetail,
  extraction: AudioExtraction
): MediaUploadResult {
  return {
    lecture_id: lecture.id,
    asset_key: extraction.source_video_key ?? 'media/demo/ai-orchestration-intro.mp4',
    video_url: lecture.video_url,
    file_name: 'ai-orchestration-intro.mp4',
    content_type: 'video/mp4',
    size_bytes: extraction.source_size_bytes ?? 0,
  };
}

export function isManualApprovalRequired(extraction: AudioExtraction | null): boolean {
  return !!extraction
    && String(extraction.stt_sync_mode ?? '').toLowerCase() === 'approval'
    && String(extraction.stt_approval_state ?? '').toLowerCase() === 'pending';
}

export function toSttPolicySummary(extraction: AudioExtraction | null) {
  if (!extraction) {
    return null;
  }
  return {
    mode: String(extraction.stt_sync_mode ?? '-'),
    overwritePolicy: String(extraction.stt_overwrite_policy ?? '-'),
    approvalState: String(extraction.stt_approval_state ?? '-'),
    notificationChannel: extraction.stt_sync_notification_channel ?? '-',
    notifiedAt: extraction.stt_sync_notified_at ?? '-',
    callbackEvents: extraction.stt_sync_metrics?.callback_events ?? 0,
    notifications: extraction.stt_sync_metrics?.notifications ?? 0,
  };
}
