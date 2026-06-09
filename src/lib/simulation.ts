import type { RaceData, RaceResult } from '@/types';

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateRace(count: number, seed: number): RaceData {
  const rng = mulberry32(seed);
  const baseSpeeds = Array.from({ length: count }, () => 1.0 + (rng() - 0.5) * 0.12);
  const pos = new Array<number>(count).fill(0);
  const finishTick = new Array<number>(count).fill(-1);
  const allPos: number[][] = Array.from({ length: count }, () => []);
  let t = 0;

  while (finishTick.some((f) => f === -1) && t < 220) {
    const progress = Math.min(1, t / 88);
    const avg = pos.reduce((a, b) => a + b) / count;

    for (let i = 0; i < count; i++) {
      if (finishTick[i] !== -1) { allPos[i].push(100); continue; }

      let spd = baseSpeeds[i];
      spd += (rng() - 0.5) * (0.55 - progress * 0.3);
      spd -= (pos[i] - avg) * 0.018;
      if (progress > 0.78) spd += rng() * 0.46;
      spd = Math.max(0.15, spd);

      pos[i] = Math.min(100, pos[i] + spd);
      if (pos[i] >= 100) finishTick[i] = t;
      allPos[i].push(pos[i]);
    }
    t++;
  }

  const order: RaceResult[] = finishTick
    .map((tick, idx) => ({ idx, tick: tick < 0 ? t : tick }))
    .sort((a, b) => a.tick - b.tick);

  return { positions: allPos, order, totalTicks: allPos[0].length };
}

export function formatSeed(seed: number): string {
  return seed.toString(16).toUpperCase().padStart(8, '0');
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}
