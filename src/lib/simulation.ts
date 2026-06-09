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

  // 80ms per tick, target ~25 seconds ≈ 312 ticks.
  // Each racer has a current speed that eases toward a randomly-changing target
  // speed. This produces smooth acceleration/deceleration instead of discrete
  // lurches. Calibration: avg target ≈ 0.32%/tick → 312 ticks to reach 100%.

  // Slight per-racer personality so the same seed always produces the same winner.
  const personalBase = Array.from({ length: count }, () => 0.22 + rng() * 0.06);

  // Current speed starts near personal base; target speed changes gradually.
  const speed  = personalBase.map(b => b);
  const target = personalBase.map(b => b);

  // Stagger first speed changes so the field doesn't move in lockstep at t=0.
  const nextChange = Array.from({ length: count }, () => Math.floor(rng() * 20));

  const pos = new Array<number>(count).fill(0);
  const finishTick = new Array<number>(count).fill(-1);
  const allPos: number[][] = Array.from({ length: count }, () => []);

  let t = 0;

  while (finishTick.some((f) => f === -1) && t < 700) {
    const avg = pos.reduce((a, b) => a + b, 0) / count;

    for (let i = 0; i < count; i++) {
      if (finishTick[i] !== -1) { allPos[i].push(100); continue; }

      // Pick a new target speed every 12–24 ticks (≈1–2 seconds).
      if (t >= nextChange[i]) {
        const sprintBoost = pos[i] > 78 ? rng() * 0.10 : 0;
        target[i] = 0.08 + rng() * 0.30 + sprintBoost + personalBase[i] * 0.30;
        nextChange[i] = t + 12 + Math.floor(rng() * 12);
      }

      // Exponential ease toward target (0.12 factor ≈ 8-tick ramp-up).
      speed[i] += (target[i] - speed[i]) * 0.12;

      // Gentle rubber banding keeps the pack together.
      let delta = speed[i] - (pos[i] - avg) * 0.003;

      delta = Math.max(0.01, delta);
      pos[i] = Math.min(100, pos[i] + delta);
      if (pos[i] >= 100 && finishTick[i] === -1) finishTick[i] = t;
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
