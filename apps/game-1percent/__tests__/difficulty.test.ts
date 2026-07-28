import { describe, expect, it } from "vitest";
import { getDifficultyForTime } from "../game/engine";
import { CONFIG } from "../game/config";

describe("getDifficultyForTime", () => {
  it("keeps lasers and the safe area off in the opening seconds", () => {
    const d = getDifficultyForTime(2);
    expect(d.lasersEnabled).toBe(false);
    expect(d.safeAreaEnabled).toBe(false);
  });

  it("enables lasers once past the configured threshold", () => {
    const before = getDifficultyForTime(CONFIG.difficulty.lasersStartAt - 0.1);
    const after = getDifficultyForTime(CONFIG.difficulty.lasersStartAt + 0.1);
    expect(before.lasersEnabled).toBe(false);
    expect(after.lasersEnabled).toBe(true);
  });

  it("enables the shrinking safe area only after 15 seconds", () => {
    expect(getDifficultyForTime(14.9).safeAreaEnabled).toBe(false);
    expect(getDifficultyForTime(15.1).safeAreaEnabled).toBe(true);
  });

  it("ramps rectangle speed up and spawn interval down over time", () => {
    const early = getDifficultyForTime(0);
    const mid = getDifficultyForTime(15);
    const late = getDifficultyForTime(60);

    expect(mid.rectSpeed).toBeGreaterThan(early.rectSpeed);
    expect(late.rectSpeed).toBeGreaterThan(mid.rectSpeed);
    expect(mid.rectSpawnInterval).toBeLessThan(early.rectSpawnInterval);
    expect(late.rectSpawnInterval).toBeLessThanOrEqual(mid.rectSpawnInterval);
  });

  it("caps rect speed and spawn interval at the configured extremes", () => {
    const capped = getDifficultyForTime(10_000);
    expect(capped.rectSpeed).toBe(CONFIG.difficulty.rectSpeedMax);
    expect(capped.rectSpawnInterval).toBe(CONFIG.difficulty.rectSpawnIntervalMin);
  });
});
