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

export default function SetupScreen({ mode, onBack, onStart }: SetupScreenProps) {
  const raceType: RaceTypeId = 'football';
  const [title, setTitle] = useState('');
  const [names, setNames] = useState(['Alice', 'Bob', 'Charlie', 'Dave']);
  const [newName, setNewName] = useState('');

  const addName = () => {
    const n = newName.trim();
    if (n && names.length < 24) { setNames((p) => [...p, n]); setNewName(''); }
  };

  const handleStart = () => {
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

      {/* Participants — 3 columns × 8 rows */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="label" style={{ margin: 0 }}>
            Participants <span style={{ color: 'var(--accent)' }}>{validCount}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--ink-muted)' }}>2–24 players</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px', alignItems: 'start' }}>
          {[0, 1, 2].map((colIdx) => {
            const start = colIdx * 8;
            const colNames = names.slice(start, start + 8);
            const showAdd = names.length < 24 && Math.floor(names.length / 8) === colIdx;
            return (
              <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colNames.map((name, rowIdx) => {
                  const i = start + rowIdx;
                  return (
                    <div key={i} className="prow">
                      <div className="pdot" style={{ backgroundColor: RACER_COLORS[i % RACER_COLORS.length] }} />
                      <input
                        className="input"
                        value={name}
                        style={{ flex: 1, minWidth: 0 }}
                        onChange={(e) => setNames((p) => p.map((n, idx) => idx === i ? e.target.value : n))}
                      />
                      <button className="btn btn-ghost btn-sm icon-btn" onClick={() => setNames((p) => p.filter((_, idx) => idx !== i))}>×</button>
                    </div>
                  );
                })}
                {showAdd && (
                  <div className="prow">
                    <div style={{ width: 13, flexShrink: 0 }} />
                    <input
                      className="input"
                      placeholder="+ Add…"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addName()}
                      style={{ flex: 1, minWidth: 0, borderStyle: 'dashed', opacity: 0.65 }}
                    />
                    <button className="btn btn-ghost btn-sm icon-btn" onClick={addName} disabled={!newName.trim()}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary btn-lg w-full" onClick={handleStart} disabled={validCount < 2}>
          {mode === 'inperson' ? '🏁 Set Up Race' : '🔗 Create Room'}
        </button>
      </div>
    </div>
  );
}
