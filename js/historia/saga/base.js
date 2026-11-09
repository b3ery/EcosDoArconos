/**
 * ECOS DO ARCANO — base.js (saga do modo História)
 * Ajudantes da saga: story() e lugares fixos e escondidos em cada região (spotOf).
 */

"use strict";

const story = () => !lifeMode();
function sagaSpot(zone, seed, avoid = []) {
  const Z = ZONES[zone];
  if (!Z) return null;
  let h = hashStr(zone + seed);
  for (let k = 0; k < 3000; k++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const x = 3 + (h % Math.max(1, Z.w - 6)),
      y = 3 + ((h >>> 8) % Math.max(1, Z.h - 6));
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1 && ok; dx++) if (!walkable(zone, x + dx, y + dy)) ok = false;
    if (ok && !avoid.some(([ax, ay]) => Math.abs(ax - x) + Math.abs(ay - y) < 6)) return [x, y];
  }
  return null;
}
const sagaCache = {};
function spotOf(zone, seed) {
  const k = zone + "|" + seed;
  if (!(k in sagaCache)) sagaCache[k] = sagaSpot(zone, seed);
  return sagaCache[k];
}
