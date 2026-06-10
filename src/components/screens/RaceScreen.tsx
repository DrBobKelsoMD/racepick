'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { simulateRace, formatSeed } from '@/lib/simulation';
import { useFootballSprite } from '@/lib/chromakey';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

const MAX_LANE_H = 180;
// Sprite sheet: 1800×800, 3 frames of 600px each
// spriteW = frameW * laneH / frameH = 600 * laneH / 800 = laneH * 0.75
const SPRITE_FRAMES = 3;

function RaceLane({ participant, position, rank, finished, racerW, flagW, raceType, laneH, spriteW, spriteSheetW, trackW, isWaiting }: {
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
  isWaiting: boolean;
}) {
  const isFootball = raceType === 'football';
  // Football: no flagW subtraction — sprite right edge reaches track right edge, putting the player deep in the end zone
  const maxTravel = Math.max(0, isFootball ? trackW - racerW : trackW - racerW - flagW);
  const pixelPos = Math.round((position / 100) * maxTravel);
  const trophyPixelPos = Math.round((position / 100) * maxTravel + spriteW / 2);
  const rawSpriteSrc = `/football-player-${participant.id % 12}.png`;
  const spriteSrc = useFootballSprite(isFootball ? rawSpriteSrc : '', participant.color, participant.id);
  const nameFontSize = isFootball ? Math.min(20, Math.max(11, Math.round(laneH * 0.24))) : 13;

  // JS-controlled frame animation: frame 0 = standing still, frames 1-2 = running
  const frameRef = useRef<HTMLDivElement>(null);
  const spriteWRef = useRef(spriteW);
  spriteWRef.current = spriteW;

  useEffect(() => {
    const el = frameRef.current;
    if (!el || !isFootball) return;
    if (isWaiting || finished) {
      el.style.backgroundPositionX = '0px';
      return;
    }
    let f = 1;
    el.style.backgroundPositionX = `-${spriteWRef.current}px`;
    const iv = setInterval(() => {
      f = f === 1 ? 2 : 1;
      el.style.backgroundPositionX = `-${f * spriteWRef.current}px`;
    }, 120);
    return () => clearInterval(iv);
  }, [isWaiting, finished, isFootball]);

  return (
    <div className="race-lane" style={isFootball ? { height: laneH } : undefined}>
      <div className="lane-label">
        <span className="lane-rank">#{rank}</span>
        <div className="lane-dot" style={{ backgroundColor: participant.color }} />
      </div>
      <div className="lane-track">
        <div className="lane-fill" style={{ width: `${position}%`, backgroundColor: participant.color }} />

        {/* Wrapper: name + sprite move together */}
        <div style={{
          position: 'absolute', top: '50%',
          transform: `translateY(-50%) translateZ(0) translateX(${pixelPos}px)`,
          transition: 'transform 100ms ease-out',
          willChange: 'transform',
          zIndex: 1,
        }}>
          {/* Name floats to the left of the sprite */}
          <div style={{
            position: 'absolute', right: '100%', top: '50%',
            transform: 'translateY(-50%)',
            paddingRight: 6, whiteSpace: 'nowrap', lineHeight: 1,
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: nameFontSize, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: isFootball ? '#ffffff' : participant.color,
            textShadow: '0 1px 8px rgba(0,0,0,0.95)',
            pointerEvents: 'none',
          }}>
            {participant.name}
          </div>

          <div className="lane-racer" style={{
            position: 'relative', top: 'auto', transform: 'none',
            transition: 'none', willChange: 'auto',
            ...(isFootball
              ? { width: spriteW, height: laneH }
              : { backgroundColor: participant.color }),
            boxShadow: finished ? '0 0 20px 8px rgba(245,166,35,0.7)' : 'none',
          }}>
            {isFootball ? (
              <div
                ref={frameRef}
                className="football-sprite"
                style={{
                  backgroundImage: `url('${spriteSrc}')`,
                  width: spriteW,
                  height: laneH,
                  backgroundSize: `${spriteSheetW}px ${laneH}px`,
                  backgroundPositionX: '0px',
                  backgroundPositionY: '0px',
                }}
              />
            ) : (
              <>
                <span className="lane-initial">{participant.name[0].toUpperCase()}</span>
                {finished && <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>}
              </>
            )}
          </div>
        </div>

        {isFootball && finished && (
          <span style={{
            position: 'absolute', bottom: '100%',
            left: `${trophyPixelPos}px`, transform: 'translateX(-50%)',
            fontSize: 18, zIndex: 10, pointerEvents: 'none',
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
  const [cdVal, setCdVal] = useState<number | 'GO!' | null>(3);
  const [tick, setTick] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [trackH, setTrackH] = useState(600);
  const [trackW, setTrackW] = useState(800);
  const [footballFlagW, setFootballFlagW] = useState(30);

  const raceData = useRef(simulateRace(participants.length, seed));
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const trackRef = useRef<HTMLDivElement>(null);
  const isFootball = raceType === 'football';

  useEffect(() => {
    const check = () => {
      setMobile(window.innerWidth < 600);
      setPortrait(window.innerWidth < window.innerHeight && window.innerWidth < 900);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useLayoutEffect(() => {
    if (!isFootball) return;
    const measure = () => {
      if (!trackRef.current) return;
      const h = trackRef.current.offsetHeight;
      const labelW = mobile ? 50 : 72;
      const effectiveW = trackRef.current.offsetWidth - labelW;
      setTrackH(h);
      setTrackW(effectiveW);
      setFootballFlagW(Math.max(20, Math.round(effectiveW * 0.08)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isFootball, mobile, participants.length]);

  const laneH = isFootball
    ? Math.min(MAX_LANE_H, Math.floor(trackH / participants.length))
    : MAX_LANE_H;
  // Maintain aspect ratio of 600×800 source frame
  const spriteW = isFootball ? Math.max(18, Math.round(laneH * 0.75)) : 0;
  const spriteSheetW = spriteW * SPRITE_FRAMES;
  const racerW = isFootball ? spriteW : (mobile ? 40 : 108);
  const flagW = isFootball ? footballFlagW : (mobile ? 20 : 26);

  useEffect(() => {
    let n = 3;
    const step = () => {
      n--;
      if (n > 0) { setCdVal(n); setTimeout(step, 900); }
      else if (n === 0) { setCdVal('GO!'); setTimeout(() => setCdVal(null), 700); }
    };
    setTimeout(step, 900);
  }, []);

  useEffect(() => {
    if (cdVal !== null) return;
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
  }, [cdVal]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = raceData.current;
  const safeTick = Math.min(tick, data.totalTicks - 1);
  const pos = participants.map((_, i) => data.positions[i][safeTick] ?? 0);
  const rankArr = [...pos.map((p, i) => ({ i, p }))].sort((a, b) => b.p - a.p);
  const ranks = new Array<number>(participants.length);
  rankArr.forEach(({ i }, r) => { ranks[i] = r + 1; });

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
      {cdVal !== null && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div key={String(cdVal)} style={{
            fontFamily: 'var(--font-d)', fontWeight: 900,
            fontSize: 'clamp(130px, 26vw, 300px)',
            color: cdVal === 'GO!' ? 'var(--accent-alt)' : '#ffffff',
            lineHeight: 1,
            textShadow: '0 4px 60px rgba(0,0,0,0.9)',
            animation: 'countPulse 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {cdVal}
          </div>
        </div>
      )}

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
          <span className="live-badge">● LIVE</span>
        </div>
      </div>

      {/* Track */}
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
            isWaiting={cdVal !== null}
          />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', letterSpacing: '0.1em', flexShrink: 0 }}>
        SEED {formatSeed(seed)} · {participants.length} RACERS
      </div>
    </div>
  );
}
