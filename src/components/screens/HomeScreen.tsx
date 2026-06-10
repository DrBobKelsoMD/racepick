'use client';

import Logo from '@/components/Logo';
import { RACE_TYPES } from '@/lib/constants';
import type { Mode } from '@/types';

interface HomeScreenProps {
  onSelect: (mode: Mode) => void;
}

export default function HomeScreen({ onSelect }: HomeScreenProps) {
  return (
    <div className="screen">
      <div className="stripe" />

      <div style={{ marginTop: 16 }}>
        <Logo size="lg" />
      </div>

      <div style={{
        fontFamily: 'var(--font-m)', fontWeight: 400, fontSize: 'clamp(13px,1.4vw,16px)',
        color: 'var(--ink-muted)', lineHeight: 1.65, maxWidth: 560,
      }}>
        Because arguments over who goes first ruin game night before it even starts, skip the boring ritual of dealing cards and start rooting for your avatar in a high-stakes showdown to determine your position. It&apos;s quick, it&apos;s fair, and it lets you start the trash-talk early.
      </div>

      <div>
        <span className="label">Choose your mode</span>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-xl" onClick={() => onSelect('inperson')}>
            🖥 In-Person
          </button>
          <button className="btn btn-xl" onClick={() => onSelect('remote')}>
            📱 Remote
          </button>
        </div>
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.9 }}>
        <span style={{ color: 'var(--ink)', fontWeight: 700 }}>In-Person</span> — one device, everyone watches together on a shared screen.<br />
        <span style={{ color: 'var(--ink)', fontWeight: 700 }}>Remote</span> — participants join via room code on their own devices.
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {RACE_TYPES.map((rt) => (
          <div key={rt.id} style={{
            fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 13, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '8px 14px',
            border: '2px solid var(--surface-alt)', borderRadius: 3,
            color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {rt.emoji} {rt.short}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}
