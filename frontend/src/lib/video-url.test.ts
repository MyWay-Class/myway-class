import { describe, expect, it } from "vitest";
import { buildProtectedVideoUrl, resolvePlayableVideoUrl } from "./video-url";

describe("video URL utilities", () => {
  it("keeps absolute playable URLs unchanged", () => {
    const input = "https://cdn.example.com/video.mp4";
    expect(resolvePlayableVideoUrl(input)).toBe(input);
  });

  it("adds token query for absolute protected URLs", () => {
    const input = "https://cdn.example.com/video.mp4";
    const output = buildProtectedVideoUrl(input, "session-token-1");
    expect(output).toBe("https://cdn.example.com/video.mp4?token=session-token-1");
  });
});
