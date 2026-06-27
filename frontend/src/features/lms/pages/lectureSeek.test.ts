import { describe, expect, it, vi } from 'vitest';
import { seekLectureVideo } from './lectureSeek';

class ReadOnlyCurrentTimeVideo {
  private _currentTime = 0;

  fastSeek = vi.fn((time: number) => {
    this._currentTime = time;
  });

  play = vi.fn(() => Promise.resolve());

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(_value: number) {
    throw new Error('currentTime is read only');
  }
}

class PrototypeSetterVideo {
  private _currentTime = 0;

  fastSeek = vi.fn();
  play = vi.fn(() => Promise.resolve());

  get currentTime() {
    return this._currentTime;
  }
}

Object.defineProperty(PrototypeSetterVideo.prototype, 'currentTime', {
  get(this: PrototypeSetterVideo) {
    return this._currentTime;
  },
  set(this: PrototypeSetterVideo, value: number) {
    this._currentTime = value;
  },
  configurable: true,
});

describe('seekLectureVideo', () => {
  it('falls back to fastSeek when currentTime cannot be assigned', () => {
    const video = new ReadOnlyCurrentTimeVideo();

    const result = seekLectureVideo(video, 19_000);

    expect(result).toBe(true);
    expect(video.fastSeek).toHaveBeenCalledWith(19);
    expect(video.play).toHaveBeenCalled();
    expect(video.currentTime).toBe(19);
  });

  it('uses the prototype currentTime setter when direct assignment is blocked', () => {
    const video = new PrototypeSetterVideo();

    const result = seekLectureVideo(video, 31_000);

    expect(result).toBe(true);
    expect(video.fastSeek).toHaveBeenCalledWith(31);
    expect(video.play).toHaveBeenCalled();
    expect(video.currentTime).toBe(31);
  });
});
