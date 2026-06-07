import { describe, expect, it } from "vitest";
import { buildProtectedVideoUrl, resolvePlayableVideoUrl } from "./video-url";

describe("video URL utilities", () => {
  it("keeps absolute playable URLs unchanged", () => {
    const input = "https://cdn.example.com/video.mp4";
    expect(resolvePlayableVideoUrl(input)).toBe(input);
  });

  it("adds token query only for media asset API URLs", () => {
    const input = "https://app.example.com/api/v1/media/assets/asset/demo/video.mp4";
    const output = buildProtectedVideoUrl(input, "session-token-1");
    expect(output).toBe("https://app.example.com/api/v1/media/assets/asset/demo/video.mp4?token=session-token-1");
  });

  it("preserves encoded slash asset URLs and keeps tokenized asset URLs stable", () => {
    const input = "http://127.0.0.1:8787/api/v1/media/assets/media%2Fcrs_ai_seed_001%2Flec_ai_seed_001.mp4";
    const output = resolvePlayableVideoUrl(input);
    expect(output).toBe(input);
  });

  it("keeps non-API absolute URLs unchanged even with session token", () => {
    const input = "https://cdn.example.com/video.mp4";
    const output = buildProtectedVideoUrl(input, "session-token-1");
    expect(output).toBe(input);
  });
});
