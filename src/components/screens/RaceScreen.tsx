'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { simulateRace, formatSeed } from '@/lib/simulation';
import { RACE_TYPES } from '@/lib/constants';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

const MAX_LANE_H = 180;

function RaceLane({ participant, position, rank, finished, racerW, flagW, raceType, laneH, spriteW, spriteSheetW, trackW }: {
  participant: Participant;
  position: number;
  rank: number;
  finished: boolean;
  racerW: number;
  flagW: number;
  raceType: RaceTypeId;
  laneH: number;
  spriteW: number;
  spriteSheetW: number;
  trackW: number;
}) {
  const isFootball = raceType === 'football';
  // Pixel-based position so we can use transform (GPU composited, smooth on mobile).
  const pixelPos = Math.round((position / 100) * Math.max(0, trackW - racerW - flagW));
  const trophyPixelPos = Math.round((position / 100) * Math.max(0, trackW - racerW - flagW) + spriteW / 2);
  return (
    <div className="race-lane" style={isFootball ? { height: laneH } : undefined}>
      <div className="lane-label">
        <span className="lane-rank">#{rank}</span>
        <div className="lane-dot" style={{ backgroundColor: participant.color }} />
        <span className="lane-name">{participant.name}</span>
      </div>
      <div className="lane-track">
        <div className="lane-fill" style={{ width: `${position}%`, backgroundColor: participant.color }} />
        <div className="lane-racer" style={{
          transform: `translateY(-50%) translateZ(0) translateX(${pixelPos}px)`,
          ...(isFootball
            ? { width: spriteW, height: laneH }
            : { backgroundColor: participant.color }),
          boxShadow: finished ? '0 0 20px 8px rgba(245,166,35,0.7)' : 'none',
        }}>
          {isFootball ? (
            <div
              className="football-sprite"
              style={{
                backgroundImage: `url('/football-player-${participant.id % 12}.png')`,
                width: spriteW,
                height: laneH,
                backgroundSize: `${spriteSheetW}px ${laneH}px`,
                '--fb-sheet-w': `-${spriteSheetW}px`,
              } as React.CSSProperties}
            />
          ) : (
            <>
              <span className="lane-initial">{participant.name[0].toUpperCase()}</span>
              <span className="lane-rname">{participant.name.toUpperCase()}</span>
              {finished && <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>}
            </>
          )}
        </div>
        {isFootball && finished && (
          <span style={{
            position: 'absolute',
            bottom: '100%',
            left: `${trophyPixelPos}px`,
            transform: 'translateX(-50%)',
            fontSize: 18,
            zIndex: 10,
            pointerEvents: 'none',
          }}>🏆</span>
        )}
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
  const [portrait, setPortrait] = useState(false);
  // trackH is the actual rendered height of the race-track div (measured via ref)
  const [trackH, setTrackH] = useState(600);
  const [trackW, setTrackW] = useState(800);
  const [footballFlagW, setFootballFlagW] = useState(46);

  const raceData = useRef(simulateRace(participants.length, seed));
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const trackRef = useRef<HTMLDivElement>(null);
  const rt = RACE_TYPES.find((r) => r.id === raceType);
  const isFootball = raceType === 'football';

  useEffect(() => {
    const check = () => {
      setMobile(window.innerWidth < 600);
      // Portrait: width < height on a mobile-sized screen
      setPortrait(window.innerWidth < window.innerHeight && window.innerWidth < 900);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Measure the track's actual rendered height (from flex:1) then derive laneH, spriteW, flagW
  // all in one pass to avoid cascading re-renders.
  useLayoutEffect(() => {
    if (!isFootball) return;
    const measure = () => {
      if (!trackRef.current) return;
      const h = trackRef.current.offsetHeight;
      const newLaneH = Math.min(MAX_LANE_H, Math.floor(h / participants.length));
      const newSpriteW = Math.max(18, Math.round(64 * newLaneH / MAX_LANE_H));
      const labelW = mobile ? 110 : 196;
      const effectiveW = trackRef.current.offsetWidth - labelW;
      setTrackH(h);
      setTrackW(effectiveW);
      setFootballFlagW(Math.max(0, Math.round(effectiveW * 0.111 - newSpriteW)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isFootball, mobile, participants.length]);

  // All lane/sprite dimensions derived from measured trackH
  const laneH = isFootball
    ? Math.min(MAX_LANE_H, Math.floor(trackH / participants.length))
    : MAX_LANE_H;
  const spriteW = isFootball ? Math.max(18, Math.round(64 * laneH / MAX_LANE_H)) : 0;
  const spriteSheetW = spriteW * 5;
  const racerW = isFootball ? spriteW : (mobile ? 40 : 108);
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

  // In portrait, rotate the entire screen so the race appears in landscape orientation.
  // width/height are swapped (100vh × 100vw) and centered with rotate(-90deg).
  const outerStyle: React.CSSProperties = portrait ? {
    position: 'fixed',
    top: 'calc(50vh - 50vw)',
    left: 'calc(50vw - 50vh)',
    width: '100vh',
    height: '100vw',
    transform: 'rotate(-90deg)',
    transformOrigin: 'center center',
    zIndex: 100,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 22px',
    gap: 12,
    ...(isFootball ? { background: 'linear-gradient(180deg, #0c2414 0%, #183520 100%)' } : {}),
  } : {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '22px 28px',
    gap: 16,
    ...(isFootball ? { background: 'linear-gradient(180deg, #0c2414 0%, #183520 100%)' } : {}),
  };

  return (
    <div style={outerStyle}>
      {showComplete && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 300,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <Logo size="sm" />
          {title && (
            <div style={{ minWidth: 0, fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 'clamp(16px,2.5vw,26px)', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)' }}>{progress}%</span>
          <span className="live-badge">● LIVE</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--surface-alt)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 80ms linear' }} />
      </div>

      {/* Track — flex:1 fills all remaining viewport height */}
      <div ref={trackRef} className={`race-track${isFootball ? ' football-field' : ''}`} style={{ flex: 1, minHeight: 0 }}>
        {participants.map((p, i) => (
          <RaceLane
            key={p.id}
            participant={p}
            position={pos[i]}
            rank={ranks[i]}
            finished={pos[i] >= 100}
            racerW={racerW}
            flagW={flagW}
            raceType={raceType}
            laneH={laneH}
            spriteW={spriteW}
            spriteSheetW={spriteSheetW}
            trackW={trackW}
          />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', letterSpacing: '0.1em', flexShrink: 0 }}>
        SEED {formatSeed(seed)} · {participants.length} RACERS
      </div>
    </div>
  );
}
