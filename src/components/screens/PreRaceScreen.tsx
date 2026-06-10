'use client';

import Logo from '@/components/Logo';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId } from '@/types';

interface PreRaceScreenProps {
  participants: Participant[];
  raceType: RaceTypeId;
  title?: string;
  onBack: () => void;
  onStartRace: () => void;
}

export default function PreRaceScreen({ participants, raceType, title, onBack, onStartRace }: PreRaceScreenProps) {
  const rt = RACE_TYPES.find((r) => r.id === raceType);

  return (
    <div className="screen">

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>←</button>
        <Logo size="sm" />
      </div>

      {/* Title */}
      <div>
        {title && (
          <div style={{
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: 'clamp(22px, 4vw, 34px)', textTransform: 'uppercase',
            letterSpacing: '0.04em', color: 'var(--accent)', marginBottom: 4,
          }}>
            {title}
          </div>
        )}
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
        <button className="btn btn-primary btn-lg w-full" onClick={onStartRace}>
          🏁 Start Race
        </button>
      </div>
    </div>
  );
}
