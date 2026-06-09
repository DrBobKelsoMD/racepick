'use client';

interface LogoProps { size?: 'sm' | 'md' | 'lg'; }

const sizes = { sm: 38, md: 68, lg: 108 };

export default function Logo({ size = 'md' }: LogoProps) {
  const sz = sizes[size];
  return (
    <div style={{
      fontFamily: 'var(--font-d)', fontWeight: 900,
      fontSize: sz, lineHeight: 1, textTransform: 'uppercase',
      letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'baseline',
      userSelect: 'none',
    }}>
      <span style={{ color: 'var(--accent)' }}>TURN</span>
      <span style={{ color: 'var(--accent-alt)', fontSize: sz * 0.42, margin: '0 3px 0 2px', lineHeight: 1 }}>▶</span>
      <span style={{ color: 'var(--ink)' }}>ORDER</span>
      <span style={{ color: 'var(--ink-muted)', fontSize: sz * 0.32, marginLeft: 2, letterSpacing: 0 }}>.APP</span>
    </div>
  );
}
