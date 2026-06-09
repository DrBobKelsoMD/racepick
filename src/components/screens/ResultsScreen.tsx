'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

interface ResultsScreenProps {
  order: RaceResult[];
  participants: Participant[];
  raceType: RaceTypeId;
  onRaceAgain: () => void;
  onDone: () => void;
}

export default function ResultsScreen({ order, participants, raceType, onRaceAgain, onDone }: ResultsScreenProps) {
  const [visible, setVisible] = useState(0);
  const rt = RACE_TYPES.find((r) => r.id === raceType);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisible(i);
      if (i >= order.length) clearInterval(t);
    }, 270);
    return () => clearInterval(t);
  }, [order.length]);

  const copyResults = () => {
    const text = order.map((item, i) => `${i + 1}. ${participants[item.idx].name}`).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="screen">
      <div>
        <Logo size="sm" />
        <div className="page-title" style={{ marginTop: 14 }}>Final Order</div>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 18, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {rt?.emoji} {rt?.label}
        </div>
      </div>

      <div className="results-list">
        {order.slice(0, visible).map((item, i) => {
          const p = participants[item.idx];
          const rowClass = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
          return (
            <div key={item.idx} className={`result-row${rowClass ? ` ${rowClass}` : ''}`} style={{ animationDelay: `${i * 0.07}s` }}>
              {i < 3
                ? <div className="result-medal">{MEDALS[i]}</div>
                : <div className="result-num">{String(i + 1).padStart(2, '0')}</div>
              }
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: p.color, border: '1.5px solid var(--border)', flexShrink: 0 }} />
              <div className="result-name">{p.name}</div>
              <div className="result-pick">PICK {String(i + 1).padStart(2, '0')}</div>
            </div>
          );
        })}
      </div>

      {visible >= order.length && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
          <button className="btn btn-sm" onClick={copyResults}>📋 Copy Order</button>
          <button className="btn btn-primary btn-sm" onClick={onRaceAgain}>🔄 Race Again</button>
          <button className="btn btn-sm" onClick={onDone}>✓ Done</button>
        </div>
      )}
    </div>
  );
}
