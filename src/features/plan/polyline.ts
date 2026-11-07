/** Decodes a Google-encoded polyline with the given precision (MOTIS uses 7). */
export function decodePolyline(str: string, precision = 6): [number, number][] {
  const factor = 10 ** precision;
  const out: [number, number][] = [];
  let i = 0, lat = 0, lon = 0;
  while (i < str.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do {
        b = str.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && i < str.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lon += delta;
    }
    out.push([lat / factor, lon / factor]);
  }
  return out;
}
