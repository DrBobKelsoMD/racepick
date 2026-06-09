'use client';

import { useState, useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { simulateRace, formatSeed } from '@/lib/simulation';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

const RACER_W = 108;
const FLAG_W = 26;

function RaceLane({ participant, position, rank, finished }: {
  participant: Participant;
  position: number;
  rank: number;
  finished: boolean;
}) {
  return (
    <div className="race-lane">
      <div className="lane-label">
        <span className="lane-rank">#{rank}</span>
        <div className="lane-dot" style={{ backgroundColor: participant.color }} />
        <span className="lane-name">{participant.name}</span>
      </div>
      <div className="lane-track">
        <div className="lane-fill" style={{ width: `${position}%`, backgroundColor: participant.color }} />
        <div className="lane-racer" style={{
          left: `calc(${position / 100} * (100% - ${RACER_W + FLAG_W}px))`,
          backgroundColor: participant.color,
          boxShadow: finished ? '0 0 16px 5px rgba(245,166,35,0.55)' : 'none',
        }}>
          <span className="lane-initial">{participant.name[0].toUpperCase()}</span>
          <span className="lane-rname">{participant.name.toUpperCase()}</span>
          {finished && <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>}
        </div>
        <div className="lane-flag" />
      </div>
    </div>
  );
}

interface RaceScreenProps {
  participants: Participant[];
  raceType: RaceTypeId;
  seed: number;
  onFinish: (order: RaceResult[]) => void;
}

export default function RaceScreen({ participants, raceType, seed, onFinish }: RaceScreenProps) {
  const [tick, setTick] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const raceData = useRef(simulateRace(participants.length, seed));
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const rt = RACE_TYPES.find((r) => r.id === raceType);

  useEffect(() => {
    let t = 0;
    const timer = setInterval(() => {
      t++;
      setTick(t);
      if (t >= raceData.current.totalTicks) {
        clearInterval(timer);
        setShowComplete(true);
        setTimeout(() => onFinishRef.current(raceData.current.order), 2200);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const data = raceData.current;
  const safeTick = Math.min(tick, data.totalTicks - 1);
  const pos = participants.map((_, i) => data.positions[i][safeTick] ?? 0);
  const rankArr = [...pos.map((p, i) => ({ i, p }))].sort((a, b) => b.p - a.p);
  const ranks = new Array<number>(participants.length);
  rankArr.forEach(({ i }, r) => { ranks[i] = r + 1; });
  const progress = Math.round((safeTick / data.totalTicks) * 100);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '22px 28px', gap: 16 }}>
      {showComplete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(26,26,46,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: 'clamp(42px, 6.5vw, 84px)', textTransform: 'uppercase',
            color: 'var(--accent-alt)', background: 'var(--ink)',
            padding: '20px 44px', border: '4px solid var(--accent-alt)',
            textAlign: 'center', animation: 'bannerPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            🏁 Race Complete!
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Logo size="sm" />
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 'clamp(20px,3vw,30px)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {rt?.emoji} {rt?.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)' }}>{progress}%</span>
          <span className="live-badge">● LIVE</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--surface-alt)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 80ms linear' }} />
      </div>

      {/* Track */}
      <div className="race-track" style={{ flex: 1 }}>
        {participants.map((p, i) => (
          <RaceLane key={p.id} participant={p} position={pos[i]} rank={ranks[i]} finished={pos[i] >= 100} />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
        SEED {formatSeed(seed)} · {participants.length} RACERS
      </div>
    </div>
  );
}
