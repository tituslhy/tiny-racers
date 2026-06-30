export function clampCarX(
  pointerX: number,
  roadLeft: number,
  roadRight: number,
  carHalfWidth: number,
): number {
  return Math.min(
    roadRight - carHalfWidth,
    Math.max(roadLeft + carHalfWidth, pointerX),
  )
}

export function advanceRace(
  progress: number,
  elapsedMs: number,
  durationMs: number,
): number {
  return Math.min(1, progress + elapsedMs / durationMs)
}

export function isRaceFinished(progress: number): boolean {
  return progress >= 1
}

export function collectibleY(
  progress: number,
  spawnProgress: number,
  startY: number,
  endY: number,
  travelProgress: number,
): number {
  const travelled = (progress - spawnProgress) / travelProgress
  return startY + travelled * (endY - startY)
}

export interface CenteredBounds {
  x: number
  y: number
  halfWidth: number
  halfHeight: number
}

export function centeredBoundsOverlap(
  first: CenteredBounds,
  second: CenteredBounds,
): boolean {
  return (
    Math.abs(first.x - second.x) <= first.halfWidth + second.halfWidth &&
    Math.abs(first.y - second.y) <= first.halfHeight + second.halfHeight
  )
}
