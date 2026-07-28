export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vector2;
  vel: Vector2;
  radius: number;
}

export interface RectObstacle {
  kind: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

export type LaserOrientation = "horizontal" | "vertical";
export type LaserPhase = "warning" | "active";

export interface LaserObstacle {
  kind: "laser";
  orientation: LaserOrientation;
  position: number; // y for horizontal, x for vertical
  phase: LaserPhase;
  timer: number; // seconds elapsed in current phase
}

export type Obstacle = RectObstacle | LaserObstacle;

export interface SafeArea {
  active: boolean;
  radius: number;
}

export interface DifficultySettings {
  rectSpawnInterval: number;
  rectSpeed: number;
  lasersEnabled: boolean;
  laserSpawnInterval: number;
  safeAreaEnabled: boolean;
}
