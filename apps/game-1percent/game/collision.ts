// Collision detection primitives. Kept pure and dependency-free so they are
// trivial to unit test in isolation from rendering or the game loop.

/** Circle-vs-axis-aligned-rectangle overlap test via closest-point clamping. */
export function circleIntersectsRect(
  cx: number,
  cy: number,
  cr: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

/** True once the circle pokes outside a circular safe boundary centered at (cx0, cy0). */
export function circleOutsideSafeArea(
  cx: number,
  cy: number,
  cr: number,
  centerX: number,
  centerY: number,
  safeRadius: number,
): boolean {
  const dx = cx - centerX;
  const dy = cy - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist + cr > safeRadius;
}

/** True if the circle touches or crosses the arena's outer bounds. */
export function circleOutsideArena(
  cx: number,
  cy: number,
  cr: number,
  width: number,
  height: number,
): boolean {
  return cx - cr < 0 || cy - cr < 0 || cx + cr > width || cy + cr > height;
}

/** An active laser is a thick band spanning the arena; test circle-vs-band overlap. */
export function circleIntersectsLaserBand(
  cx: number,
  cy: number,
  cr: number,
  orientation: "horizontal" | "vertical",
  position: number,
  thickness: number,
): boolean {
  const halfThickness = thickness / 2;
  const distance = orientation === "horizontal" ? Math.abs(cy - position) : Math.abs(cx - position);
  return distance < cr + halfThickness;
}
