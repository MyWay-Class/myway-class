import { demoCourses, getDemoUser } from '../../data/demo-data';
import type { ShortformCommunityItem, ShortformShare, ShortformShareRequest } from '../../types';
import {
  buildVideoDetail,
  createId,
  demoShortformLikes,
  demoShortformSaves,
  demoShortformShares,
  demoShortformVideos,
  getVideo,
  now,
} from './data';
import { canAccessShortformCommunityVideo } from './helpers';

export function shareShortformVideo(userId: string, input: ShortformShareRequest) {
  const video = getVideo(input.video_id);
  if (!video || video.user_id !== userId) {
    return null;
  }

  if (!canAccessShortformCommunityVideo(userId, video, input.course_id)) {
    return null;
  }

  const existing = demoShortformShares.find((share) => share.video_id === input.video_id && share.shared_by === userId);
  if (existing) {
    return null;
  }

  const share: ShortformShare = {
    id: createId('sfs', demoShortformShares.length),
    video_id: input.video_id,
    course_id: input.course_id,
    shared_by: userId,
    visibility: input.visibility ?? 'course',
    message: input.message?.trim() || null,
    created_at: now(),
  };

  demoShortformShares.push(share);
  const record = demoShortformVideos.find((item) => item.id === input.video_id);
  if (record) {
    record.share_count += 1;
    record.status = 'PUBLIC';
  }

  return share;
}

export function listShortformCommunity(userId: string, courseId?: string): ShortformCommunityItem[] {
  return demoShortformShares
    .filter((share) => {
      const video = getVideo(share.video_id);
      if (!video) {
        return false;
      }

      const enrolled = canAccessShortformCommunityVideo(userId, video, share.course_id);
      const matchesCourse = courseId ? share.course_id === courseId : true;
      return enrolled && matchesCourse && share.visibility === 'course';
    })
    .map((share) => {
      const video = getVideo(share.video_id)!;
      const course = demoCourses.find((item) => item.id === share.course_id);
      return {
        ...buildVideoDetail(video),
        shared_by_name: getDemoUser(share.shared_by)?.name ?? '공유자',
        course_title: course?.title ?? '알 수 없는 강의',
        is_saved: demoShortformSaves.some((save) => save.user_id === userId && save.video_id === video.id),
        is_liked: demoShortformLikes.some((like) => like.user_id === userId && like.video_id === video.id),
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
