import { beforeEach, describe, expect, it } from "vitest";
import {
  getMuted,
  getPersonalBest,
  getRunCount,
  incrementRunCount,
  setMuted,
  setPersonalBestIfHigher,
} from "../lib/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("personal best storage", () => {
  it("defaults to 0 when nothing is stored", () => {
    expect(getPersonalBest()).toBe(0);
  });

  it("stores a new score as the best", () => {
    expect(setPersonalBestIfHigher(12.3)).toBe(12.3);
    expect(getPersonalBest()).toBe(12.3);
  });

  it("keeps the higher score and ignores a lower one", () => {
    setPersonalBestIfHigher(20);
    expect(setPersonalBestIfHigher(9)).toBe(20);
    expect(getPersonalBest()).toBe(20);
  });

  it("replaces the best when a higher score comes in", () => {
    setPersonalBestIfHigher(10);
    expect(setPersonalBestIfHigher(15)).toBe(15);
    expect(getPersonalBest()).toBe(15);
  });
});

describe("run count storage", () => {
  it("starts at 0 and increments", () => {
    expect(getRunCount()).toBe(0);
    expect(incrementRunCount()).toBe(1);
    expect(incrementRunCount()).toBe(2);
    expect(getRunCount()).toBe(2);
  });
});

describe("mute preference storage", () => {
  it("defaults to unmuted", () => {
    expect(getMuted()).toBe(false);
  });

  it("persists the muted flag", () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });
});
