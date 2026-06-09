'use client';

import { THEMES } from '@/lib/constants';
import type { Theme } from '@/types';

interface ThemeSwitcherProps {
  theme: Theme;
  onChange: (t: Theme) => void;
}

export default function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  return (
    <div style={{ position: 'fixed', top: 18, right: 18, display: 'flex', gap: 8, zIndex: 500 }}>
      {Object.values(THEMES).map((t) => (
        <button
          key={t.id}
          title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
          onClick={() => onChange(t.id)}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            background: t.vars['--accent'],
            border: theme === t.id ? '3px solid var(--border)' : '2px solid transparent',
            boxShadow: theme === t.id ? '0 0 0 2px var(--bg)' : 'none',
            cursor: 'pointer', padding: 0, outline: 'none', flexShrink: 0,
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        />
      ))}
    </div>
  );
}
