import { describe, expect, it } from "vitest";
import { estimatePercentile } from "../game/percentile";

describe("estimatePercentile", () => {
  it("matches the documented anchor points", () => {
    expect(estimatePercentile(5)).toBe(20);
    expect(estimatePercentile(10)).toBe(45);
    expect(estimatePercentile(20)).toBe(75);
    expect(estimatePercentile(30)).toBe(90);
    expect(estimatePercentile(45)).toBe(97);
    expect(estimatePercentile(60)).toBe(99);
  });

  it("interpolates linearly between anchors", () => {
    // Halfway between 5s (20th) and 10s (45th) should land at ~32.5th.
    expect(estimatePercentile(7.5)).toBeCloseTo(32.5, 5);
  });

  it("clamps negative or zero time to the bottom", () => {
    expect(estimatePercentile(0)).toBe(0);
    expect(estimatePercentile(-5)).toBe(0);
  });

  it("caps runs beyond the last anchor", () => {
    expect(estimatePercentile(120)).toBe(99.5);
  });

  it("is monotonically non-decreasing", () => {
    let prev = -Infinity;
    for (let t = 0; t <= 90; t += 1) {
      const p = estimatePercentile(t);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});
