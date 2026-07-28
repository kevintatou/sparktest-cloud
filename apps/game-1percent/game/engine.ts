import { CONFIG } from "./config";
import {
  circleIntersectsLaserBand,
  circleIntersectsRect,
  circleOutsideArena,
  circleOutsideSafeArea,
} from "./collision";
import type {
  DifficultySettings,
  LaserObstacle,
  Obstacle,
  Player,
  RectObstacle,
  SafeArea,
} from "./entities";

/** Pure function: given elapsed run time, what should the game throw at the player? */
export function getDifficultyForTime(t: number): DifficultySettings {
  const d = CONFIG.difficulty;
  const rectRamp = Math.min(1, t / d.rectSpawnRampSeconds);
  const speedRamp = Math.min(1, t / d.rectSpeedRampSeconds);
  const laserRamp = Math.min(1, t / d.laserSpawnRampSeconds);

  return {
    rectSpawnInterval: d.rectSpawnIntervalStart + (d.rectSpawnIntervalMin - d.rectSpawnIntervalStart) * rectRamp,
    rectSpeed: d.rectSpeedStart + (d.rectSpeedMax - d.rectSpeedStart) * speedRamp,
    lasersEnabled: t >= d.lasersStartAt,
    laserSpawnInterval:
      d.laserSpawnIntervalStart + (d.laserSpawnIntervalMin - d.laserSpawnIntervalStart) * laserRamp,
    safeAreaEnabled: t >= d.safeAreaStartAt,
  };
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class GameEngine {
  width: number;
  height: number;
  elapsed = 0;
  alive = true;
  player: Player;
  obstacles: Obstacle[] = [];
  safeArea: SafeArea = { active: false, radius: 0 };

  private target: { x: number; y: number };
  private rectSpawnTimer = 0;
  private laserSpawnTimer: number = CONFIG.difficulty.laserSpawnIntervalStart;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.player = {
      pos: { x: width / 2, y: height / 2 },
      vel: { x: 0, y: 0 },
      radius: CONFIG.player.radius,
    };
    this.target = { x: width / 2, y: height / 2 };
    this.rectSpawnTimer = CONFIG.difficulty.rectSpawnIntervalStart;
  }

  reset(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.elapsed = 0;
    this.alive = true;
    this.obstacles = [];
    this.safeArea = { active: false, radius: 0 };
    this.player = {
      pos: { x: width / 2, y: height / 2 },
      vel: { x: 0, y: 0 },
      radius: CONFIG.player.radius,
    };
    this.target = { x: width / 2, y: height / 2 };
    this.rectSpawnTimer = CONFIG.difficulty.rectSpawnIntervalStart;
    this.laserSpawnTimer = CONFIG.difficulty.laserSpawnIntervalStart;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    // Keep the player inside the new bounds so a resize alone can't end the run.
    this.player.pos.x = Math.min(Math.max(this.player.pos.x, this.player.radius), width - this.player.radius);
    this.player.pos.y = Math.min(Math.max(this.player.pos.y, this.player.radius), height - this.player.radius);
  }

  setTarget(x: number, y: number) {
    this.target.x = x;
    this.target.y = y;
  }

  private spawnRect(speed: number) {
    const size = randomRange(CONFIG.rect.minSize, CONFIG.rect.maxSize);
    const crossHorizontal = Math.random() < 0.5;
    const forward = Math.random() < 0.5;
    const jitteredSpeed = speed * randomRange(0.85, 1.15);

    let x: number;
    let y: number;
    let vx: number;
    let vy: number;

    if (crossHorizontal) {
      x = forward ? -size : this.width + size;
      y = randomRange(0, this.height - size);
      vx = forward ? jitteredSpeed : -jitteredSpeed;
      vy = 0;
    } else {
      x = randomRange(0, this.width - size);
      y = forward ? -size : this.height + size;
      vx = 0;
      vy = forward ? jitteredSpeed : -jitteredSpeed;
    }

    const rect: RectObstacle = { kind: "rect", x, y, width: size, height: size, vx, vy };
    this.obstacles.push(rect);
  }

  private spawnLaser() {
    const orientation = Math.random() < 0.5 ? "horizontal" : "vertical";
    const position =
      orientation === "horizontal" ? randomRange(40, this.height - 40) : randomRange(40, this.width - 40);
    const laser: LaserObstacle = { kind: "laser", orientation, position, phase: "warning", timer: 0 };
    this.obstacles.push(laser);
  }

  update(dt: number) {
    if (!this.alive) return;

    this.elapsed += dt;
    const difficulty = getDifficultyForTime(this.elapsed);

    this.updatePlayer(dt);
    this.updateSpawning(dt, difficulty);
    this.updateObstacles(dt);
    this.updateSafeArea(dt, difficulty);
    this.checkCollisions();
  }

  private updatePlayer(dt: number) {
    const { followStiffness, followDamping } = CONFIG.player;
    const p = this.player;
    const ax = (this.target.x - p.pos.x) * followStiffness - p.vel.x * followDamping;
    const ay = (this.target.y - p.pos.y) * followStiffness - p.vel.y * followDamping;
    p.vel.x += ax * dt;
    p.vel.y += ay * dt;
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
  }

  private updateSpawning(dt: number, difficulty: DifficultySettings) {
    this.rectSpawnTimer -= dt;
    if (this.rectSpawnTimer <= 0) {
      this.spawnRect(difficulty.rectSpeed);
      this.rectSpawnTimer = difficulty.rectSpawnInterval * randomRange(0.8, 1.2);
    }

    if (difficulty.lasersEnabled) {
      this.laserSpawnTimer -= dt;
      if (this.laserSpawnTimer <= 0) {
        this.spawnLaser();
        this.laserSpawnTimer = difficulty.laserSpawnInterval * randomRange(0.8, 1.2);
      }
    }
  }

  private updateObstacles(dt: number) {
    const margin = CONFIG.rect.maxSize + 20;
    this.obstacles = this.obstacles.filter((o) => {
      if (o.kind === "rect") {
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        return (
          o.x + o.width > -margin &&
          o.x < this.width + margin &&
          o.y + o.height > -margin &&
          o.y < this.height + margin
        );
      }

      o.timer += dt;
      if (o.phase === "warning" && o.timer >= CONFIG.laser.warningDuration) {
        o.phase = "active";
        o.timer = 0;
      }
      if (o.phase === "active" && o.timer >= CONFIG.laser.activeDuration) {
        return false;
      }
      return true;
    });
  }

  private updateSafeArea(dt: number, difficulty: DifficultySettings) {
    if (!difficulty.safeAreaEnabled) return;

    if (!this.safeArea.active) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      this.safeArea = {
        active: true,
        radius: Math.sqrt(cx * cx + cy * cy),
      };
      return;
    }

    this.safeArea.radius = Math.max(
      CONFIG.safeArea.minRadius,
      this.safeArea.radius - CONFIG.safeArea.shrinkRatePerSecond * dt,
    );
  }

  private checkCollisions() {
    const { pos, radius } = this.player;

    if (circleOutsideArena(pos.x, pos.y, radius, this.width, this.height)) {
      this.alive = false;
      return;
    }

    if (this.safeArea.active) {
      const outsideSafeArea = circleOutsideSafeArea(
        pos.x,
        pos.y,
        radius,
        this.width / 2,
        this.height / 2,
        this.safeArea.radius,
      );
      if (outsideSafeArea) {
        this.alive = false;
        return;
      }
    }

    for (const o of this.obstacles) {
      if (o.kind === "rect") {
        if (circleIntersectsRect(pos.x, pos.y, radius, o.x, o.y, o.width, o.height)) {
          this.alive = false;
          return;
        }
      } else if (o.phase === "active") {
        if (circleIntersectsLaserBand(pos.x, pos.y, radius, o.orientation, o.position, CONFIG.laser.thickness)) {
          this.alive = false;
          return;
        }
      }
    }
  }
}
