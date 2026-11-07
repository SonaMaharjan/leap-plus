export type LatLng = [number, number];

/** Linear interpolation between two positions; k is clamped to [0, 1]. */
export function lerpLatLng(from: LatLng, to: LatLng, k: number): LatLng {
  const t = Math.max(0, Math.min(1, k));
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}
