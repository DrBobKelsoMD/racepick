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
      <span style={{ color: 'var(--accent)' }}>RACE</span>
      <span style={{ color: 'var(--accent-alt)', fontSize: sz * 0.42, margin: '0 3px 0 2px', lineHeight: 1 }}>▶</span>
      <span style={{ color: 'var(--ink)' }}>PICK</span>
    </div>
  );
}
