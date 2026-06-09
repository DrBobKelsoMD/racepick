'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { simulateRace, formatSeed } from '@/lib/simulation';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

function RaceLane({ participant, position, rank, finished, racerW, flagW, raceType }: {
  participant: Participant;
  position: number;
  rank: number;
  finished: boolean;
  racerW: number;
  flagW: number;
  raceType: RaceTypeId;
}) {
  const isFootball = raceType === 'football';
  return (
    <div className="race-lane">
      <div className="lane-label">
        <span className="lane-rank">#{rank}</span>
        <div className="lane-dot" style={{ backgroundColor: participant.color }} />
        <span className="lane-name">{participant.name}</span>
      </div>
      <div className="lane-track">
        <div className="lane-fill" style={{ width: `${position}%`, backgroundColor: participant.color }} />
        <div className="lane-racer" style={{
          left: `calc(${position / 100} * (100% - ${racerW + flagW}px))`,
          ...(isFootball ? {} : { backgroundColor: participant.color }),
          boxShadow: finished ? '0 0 20px 8px rgba(245,166,35,0.7)' : 'none',
        }}>
          {isFootball ? (
            <>
              <div className="football-sprite" style={{ backgroundImage: `url('/football-player-${participant.id % 12}.png')` }} />
              {finished && <span style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>🏆</span>}
            </>
          ) : (
            <>
              <span className="lane-initial">{participant.name[0].toUpperCase()}</span>
              <span className="lane-rname">{participant.name.toUpperCase()}</span>
              {finished && <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>}
            </>
          )}
        </div>
        <div className="lane-flag" />
      </div>
    </div>
  );
}

interface RaceScreenProps {
  participants: Participant[];
  raceType: RaceTypeId;
  seed: number;
  title?: string;
  onFinish: (order: RaceResult[]) => void;
}

export default function RaceScreen({ participants, raceType, seed, title, onFinish }: RaceScreenProps) {
  const [tick, setTick] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [mobile, setMobile] = useState(false);
  const raceData = useRef(simulateRace(participants.length, seed));
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const rt = RACE_TYPES.find((r) => r.id === raceType);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isFootball = raceType === 'football';
  // Football uses sprite frame width; others use pill width
  const racerW = isFootball ? (mobile ? 46 : 64) : (mobile ? 40 : 108);
  const [footballFlagW, setFootballFlagW] = useState(120);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isFootball) return;
    const measure = () => {
      if (!trackRef.current) return;
      const labelW = mobile ? 80 : 196;
      const trackW = trackRef.current.offsetWidth - labelW;
      setFootballFlagW(Math.max(0, Math.round(trackW * 0.10)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isFootball, mobile]);

  const flagW = isFootball ? footballFlagW : (mobile ? 20 : 26);

  useEffect(() => {
    let t = 0;
    const timer = setInterval(() => {
      t++;
      setTick(t);
      if (t >= raceData.current.totalTicks) {
        clearInterval(timer);
        setShowComplete(true);
        setTimeout(() => onFinishRef.current(raceData.current.order), 2200);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const data = raceData.current;
  const safeTick = Math.min(tick, data.totalTicks - 1);
  const pos = participants.map((_, i) => data.positions[i][safeTick] ?? 0);
  const rankArr = [...pos.map((p, i) => ({ i, p }))].sort((a, b) => b.p - a.p);
  const ranks = new Array<number>(participants.length);
  rankArr.forEach(({ i }, r) => { ranks[i] = r + 1; });
  const progress = Math.round((safeTick / data.totalTicks) * 100);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '22px 28px', gap: 16,
      ...(isFootball && { background: 'linear-gradient(180deg, #0c2414 0%, #183520 100%)' }),
    }}>
      {showComplete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(26,26,46,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: 'clamp(42px, 6.5vw, 84px)', textTransform: 'uppercase',
            color: 'var(--accent-alt)', background: 'var(--ink)',
            padding: '20px 44px', border: '4px solid var(--accent-alt)',
            textAlign: 'center', animation: 'bannerPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            🏁 Race Complete!
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <Logo size="sm" />
          <div style={{ minWidth: 0 }}>
            {title && (
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 'clamp(13px,2vw,18px)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', lineHeight: 1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </div>
            )}
            <span style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 'clamp(20px,3vw,30px)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {rt?.emoji} {rt?.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)' }}>{progress}%</span>
          <span className="live-badge">● LIVE</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--surface-alt)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 80ms linear' }} />
      </div>

      {/* Track */}
      <div ref={trackRef} className={`race-track${isFootball ? ' football-field' : ''}`} style={{ flex: 1 }}>
        {participants.map((p, i) => (
          <RaceLane key={p.id} participant={p} position={pos[i]} rank={ranks[i]} finished={pos[i] >= 100} racerW={racerW} flagW={flagW} raceType={raceType} />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
        SEED {formatSeed(seed)} · {participants.length} RACERS
      </div>
    </div>
  );
}
