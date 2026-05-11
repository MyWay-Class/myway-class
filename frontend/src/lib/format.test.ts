import { describe, expect, it } from "vitest";
import { formatDifficulty, formatPercentage } from "./format";

describe("format utilities", () => {
  it("maps difficulty labels to Korean text", () => {
    expect(formatDifficulty("beginner")).toBe("입문");
    expect(formatDifficulty("intermediate")).toBe("중급");
    expect(formatDifficulty("advanced")).toBe("고급");
  });

  it("formats percentage values", () => {
    expect(formatPercentage(0)).toBe("0%");
    expect(formatPercentage(75)).toBe("75%");
    expect(formatPercentage(100)).toBe("100%");
  });
});
