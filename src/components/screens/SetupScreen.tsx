'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';
import { RACER_COLORS } from '@/lib/constants';
import type { Mode, Participant, RaceTypeId } from '@/types';

interface SetupScreenProps {
  mode: Mode;
  onBack: () => void;
  onStart: (data: { participants: Participant[]; raceType: RaceTypeId; title: string }) => void;
}

const EVENT_TYPES = [
  { id: 'football' as RaceTypeId, emoji: '🏈', label: 'Fantasy Football', sub: 'Draft Order', available: true },
  { id: null, emoji: '🎲', label: 'Game Board', sub: 'Turn Order', available: false },
];

export default function SetupScreen({ mode, onBack, onStart }: SetupScreenProps) {
  const [raceType, setRaceType] = useState<RaceTypeId>('football');
  const [title, setTitle] = useState('');
  const [names, setNames] = useState(Array(5).fill(''));

  const isRemote = mode === 'remote';

  const handleStart = () => {
    if (isRemote) {
      onStart({ participants: [], raceType, title: title.trim() });
      return;
    }
    const valid = names.map((n) => n.trim()).filter(Boolean);
    if (valid.length < 2) return;
    onStart({
      participants: valid.map((name, i) => ({ id: i, name, color: RACER_COLORS[i % RACER_COLORS.length] })),
      raceType,
      title: title.trim(),
    });
  };

  const validCount = names.filter((n) => n.trim()).length;

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>←</button>
        <Logo size="sm" />
        <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          {mode === 'inperson' ? 'In-Person' : 'Remote'} Setup
        </span>
      </div>

      {/* Race title */}
      <div>
        <span className="label">Race Title <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', fontSize: 10 }}>(optional)</span></span>
        <input
          className="input"
          placeholder="e.g. Fantasy Draft 2026, Snake Draft Round 1…"
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Participants — only shown for in-person mode */}
      {!isRemote && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span className="label" style={{ margin: 0 }}>
              Participants <span style={{ color: 'var(--accent)' }}>{validCount}</span>
            </span>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--ink-muted)' }}>leave blank to skip</span>
          </div>
          <div className="participant-grid">
            {names.map((name, i) => (
              <div key={i} className="prow">
                <div className="pdot" style={{ backgroundColor: RACER_COLORS[i % RACER_COLORS.length] }} />
                <input
                  className="input"
                  value={name}
                  placeholder={`Player ${i + 1}`}
                  style={{ flex: 1, minWidth: 0 }}
                  onChange={(e) => setNames((p) => p.map((n, idx) => idx === i ? e.target.value : n))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event type selector — shown for both modes */}
      <div>
        <span className="label">Event Type</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {EVENT_TYPES.map((et) => {
            const selected = et.available && et.id === raceType;
            return (
              <div
                key={et.label}
                onClick={() => et.available && et.id && setRaceType(et.id)}
                style={{
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 4,
                  padding: '18px 16px',
                  background: selected ? 'rgba(232,76,61,0.07)' : 'var(--surface)',
                  cursor: et.available ? 'pointer' : 'default',
                  opacity: et.available ? 1 : 0.45,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                  boxShadow: selected ? `3px 3px 0 var(--accent)` : `3px 3px 0 var(--border)`,
                  transition: 'box-shadow 0.08s, border-color 0.08s, background 0.08s',
                }}
              >
                {!et.available && (
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 9,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--ink-muted)', border: '1.5px solid var(--surface-alt)',
                    borderRadius: 2, padding: '2px 5px',
                  }}>Soon</span>
                )}
                <span style={{ fontSize: 32, lineHeight: 1 }}>{et.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 18, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, color: selected ? 'var(--accent)' : 'var(--ink)' }}>{et.label}</div>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 2 }}>{et.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isRemote && (
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          Participants join via room code on their own devices. No need to enter names here.
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary btn-lg w-full" onClick={handleStart} disabled={!isRemote && validCount < 2}>
          {isRemote ? '🔗 Create Room' : '🏁 Set Up Race'}
        </button>
      </div>
    </div>
  );
}
