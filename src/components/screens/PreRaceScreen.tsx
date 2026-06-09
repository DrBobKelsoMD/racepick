'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId } from '@/types';

interface PreRaceScreenProps {
  participants: Participant[];
  raceType: RaceTypeId;
  onBack: () => void;
  onStartRace: () => void;
}

export default function PreRaceScreen({ participants, raceType, onBack, onStartRace }: PreRaceScreenProps) {
  const [cdVal, setCdVal] = useState<number | 'GO!' | null>(null);
  const rt = RACE_TYPES.find((r) => r.id === raceType);

  const startCountdown = () => {
    let n = 3;
    setCdVal(n);
    const tick = () => {
      n--;
      if (n > 0) { setCdVal(n); setTimeout(tick, 900); }
      else if (n === 0) {
        setCdVal('GO!');
        setTimeout(() => { setCdVal(null); onStartRace(); }, 680);
      }
    };
    setTimeout(tick, 900);
  };

  return (
    <div className="screen">
      {cdVal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div key={String(cdVal)} style={{
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: 'clamp(130px, 26vw, 300px)',
            color: cdVal === 'GO!' ? 'var(--accent-alt)' : 'var(--accent)',
            lineHeight: 1,
            animation: 'countPulse 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {cdVal}
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>←</button>
        <Logo size="sm" />
      </div>

      {/* Title */}
      <div>
        <div className="page-title">Starting Grid</div>
        <div style={{
          fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 18,
          color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
        }}>
          {rt?.emoji} {rt?.label} · {participants.length} racers
        </div>
      </div>

      {/* Grid */}
      <div className="grid-list">
        {participants.map((p, i) => (
          <div key={p.id} className="grid-row">
            <div className="grid-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="grid-av" style={{ backgroundColor: p.color }}>
              {p.name[0].toUpperCase()}
            </div>
            <div className="grid-name">{p.name}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary btn-lg w-full" onClick={startCountdown}>
          🏁 Start Countdown
        </button>
      </div>
    </div>
  );
}
