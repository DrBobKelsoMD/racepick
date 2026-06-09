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

  // 80ms per tick, target ~25 seconds = ~312 ticks
  // Calibration: baseline 0.10%/tick + burst 1–5% every 10–18 ticks
  // Expected: 22 bursts × 3% avg + 312 × 0.10% ≈ 100% → leader finishes ~25s

  // Tiny per-racer pace variation so ties break naturally
  const basePace = Array.from({ length: count }, () => 0.08 + rng() * 0.04);

  const pos = new Array<number>(count).fill(0);
  const finishTick = new Array<number>(count).fill(-1);
  const allPos: number[][] = Array.from({ length: count }, () => []);

  // Stagger first bursts so racers don't all jump simultaneously at t=0
  const nextBurstAt = Array.from({ length: count }, () => Math.floor(rng() * 8));

  let t = 0;

  while (finishTick.some((f) => f === -1) && t < 500) {
    const avg = pos.reduce((a, b) => a + b, 0) / count;

    for (let i = 0; i < count; i++) {
      if (finishTick[i] !== -1) { allPos[i].push(100); continue; }

      // Smooth baseline creep between bursts
      let delta = basePace[i];

      // Gentle rubber banding — keeps field together without eliminating drama
      delta -= (pos[i] - avg) * 0.003;

      // Burst: a sudden surge visible as a lurch forward
      if (t >= nextBurstAt[i]) {
        // 1–5% per burst as requested; at ~80% progress tighten to create sprint drama
        const sprintBonus = pos[i] > 80 ? rng() * 1.5 : 0;
        const burstSize = 1 + rng() * 4 + sprintBonus; // 1–5% (+ up to 1.5% sprint)
        delta += burstSize;
        // Next burst: 10–18 ticks from now (0.8–1.4 seconds)
        nextBurstAt[i] = t + 10 + Math.floor(rng() * 8);
      }

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
