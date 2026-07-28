// Single source of truth for every tunable value in the game.
// Adjust numbers here rather than scattering magic constants through the code.

export const CONFIG = {
  player: {
    radius: 10,
    color: "#f2f5ff",
    // Higher stiffness = snappier follow, higher damping = less overshoot.
    followStiffness: 90,
    followDamping: 12,
  },
  arena: {
    background: "#0a0a12",
    edgeColor: "rgba(255,255,255,0.08)",
  },
  difficulty: {
    // Phase boundaries, in seconds since run start.
    lasersStartAt: 5,
    fastPhaseStartAt: 5,
    safeAreaStartAt: 15,
    // Rectangle spawn cadence shrinks (spawns faster) as time passes.
    rectSpawnIntervalStart: 1.1,
    rectSpawnIntervalMin: 0.35,
    rectSpawnRampSeconds: 30,
    rectSpeedStart: 90,
    rectSpeedMax: 340,
    rectSpeedRampSeconds: 35,
    laserSpawnIntervalStart: 3.2,
    laserSpawnIntervalMin: 1.1,
    laserSpawnRampSeconds: 30,
  },
  rect: {
    minSize: 26,
    maxSize: 70,
    color: "#ff5d5d",
  },
  laser: {
    warningDuration: 0.6,
    activeDuration: 0.25,
    thickness: 8,
    warningColor: "rgba(255, 220, 90, 0.6)",
    activeColor: "#ffdc5a",
  },
  safeArea: {
    shrinkRatePerSecond: 26,
    minRadius: 70,
    color: "rgba(120, 170, 255, 0.9)",
  },
  shake: {
    durationMs: 220,
    magnitudePx: 10,
  },
} as const;
