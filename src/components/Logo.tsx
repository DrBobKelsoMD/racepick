'use client';

interface LogoProps { size?: 'sm' | 'md' | 'lg'; }

const sizes: Record<string, number | string> = { sm: 38, md: 68, lg: 'clamp(40px, 17.5vw, 108px)' };

export default function Logo({ size = 'md' }: LogoProps) {
  const sz = sizes[size];
  const isLg = size === 'lg';
  return (
    <div style={{
      fontFamily: 'var(--font-d)', fontWeight: 900,
      fontSize: sz, lineHeight: 1, textTransform: 'uppercase',
      letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'baseline',
      userSelect: 'none',
    }}>
      <span style={{ color: 'var(--accent)' }}>TURN</span>
      <span style={{ color: '#89CFF0' }}>ORDER</span>
      <span style={{ color: 'var(--ink-muted)', fontSize: isLg ? '0.32em' : (sz as number) * 0.32, marginLeft: '0.02em', letterSpacing: 0 }}>.APP</span>
    </div>
  );
}
