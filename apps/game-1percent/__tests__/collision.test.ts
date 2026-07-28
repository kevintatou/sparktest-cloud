import { describe, expect, it } from "vitest";
import {
  circleIntersectsLaserBand,
  circleIntersectsRect,
  circleOutsideArena,
  circleOutsideSafeArea,
} from "../game/collision";

describe("circleIntersectsRect", () => {
  it("detects overlap when the circle center is inside the rect", () => {
    expect(circleIntersectsRect(50, 50, 10, 40, 40, 20, 20)).toBe(true);
  });

  it("detects overlap when the circle only grazes a corner", () => {
    // Rect corner at (20,20); circle centered just outside it, radius covers the gap.
    expect(circleIntersectsRect(13, 13, 10, 20, 20, 30, 30)).toBe(true);
  });

  it("returns false when clearly separated", () => {
    expect(circleIntersectsRect(0, 0, 5, 100, 100, 20, 20)).toBe(false);
  });

  it("returns false when just out of reach", () => {
    // Closest point is (20,20); distance from (0,0) is ~28.28, greater than radius 5.
    expect(circleIntersectsRect(0, 0, 5, 20, 20, 30, 30)).toBe(false);
  });
});

describe("circleOutsideArena", () => {
  it("is false when fully inside", () => {
    expect(circleOutsideArena(50, 50, 10, 200, 200)).toBe(false);
  });

  it("is true when touching the left edge", () => {
    expect(circleOutsideArena(5, 50, 10, 200, 200)).toBe(true);
  });

  it("is true when touching the bottom-right corner region", () => {
    expect(circleOutsideArena(195, 195, 10, 200, 200)).toBe(true);
  });
});

describe("circleOutsideSafeArea", () => {
  it("is false when well within the safe circle", () => {
    expect(circleOutsideSafeArea(100, 100, 10, 100, 100, 50)).toBe(false);
  });

  it("is true once the circle pokes past the safe radius", () => {
    expect(circleOutsideSafeArea(145, 100, 10, 100, 100, 50)).toBe(true);
  });
});

describe("circleIntersectsLaserBand", () => {
  it("detects a hit on a horizontal band", () => {
    expect(circleIntersectsLaserBand(50, 100, 10, "horizontal", 100, 8)).toBe(true);
  });

  it("misses a horizontal band when far away", () => {
    expect(circleIntersectsLaserBand(50, 300, 10, "horizontal", 100, 8)).toBe(false);
  });

  it("detects a hit on a vertical band", () => {
    expect(circleIntersectsLaserBand(100, 50, 10, "vertical", 100, 8)).toBe(true);
  });
});
