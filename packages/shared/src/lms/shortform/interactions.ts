import type { ShortformLikeRequest, ShortformSaveRequest } from '../../types';
import {
  createId,
  demoShortformLikes,
  demoShortformSaves,
  getVideo,
  now,
} from './data';

export function saveShortformVideo(userId: string, input: ShortformSaveRequest) {
  const video = getVideo(input.video_id);
  if (!video) {
    return null;
  }

  const existing = demoShortformSaves.find((save) => save.user_id === userId && save.video_id === input.video_id);
  if (existing) {
    return null;
  }

  const save = {
    id: createId('sfvsave', demoShortformSaves.length),
    user_id: userId,
    video_id: input.video_id,
    note: input.note?.trim() || null,
    folder: input.folder?.trim() || 'default',
    created_at: now(),
  };

  demoShortformSaves.push(save);
  video.save_count += 1;
  return save;
}

export function toggleShortformLike(userId: string, input: ShortformLikeRequest) {
  const video = getVideo(input.video_id);
  if (!video) {
    return null;
  }

  const existingIndex = demoShortformLikes.findIndex((like) => like.user_id === userId && like.video_id === input.video_id);
  if (existingIndex >= 0) {
    demoShortformLikes.splice(existingIndex, 1);
    video.like_count = Math.max(0, video.like_count - 1);
    return { liked: false };
  }

  demoShortformLikes.push({
    id: createId('sfl', demoShortformLikes.length),
    user_id: userId,
    video_id: input.video_id,
    created_at: now(),
  });
  video.like_count += 1;
  return { liked: true };
}
