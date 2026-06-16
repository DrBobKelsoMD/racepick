'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { simulateRace, formatSeed } from '@/lib/simulation';
import { useFootballSprite, useMeepleSprite } from '@/lib/chromakey';
import type { Participant, RaceTypeId, RaceResult } from '@/types';

const MAX_LANE_H = 180;
const SPRITE_FRAMES = 3;

// Sprite frame aspect ratios (spriteW = laneH * ratio)
// Football: 600px wide × 800px tall source frame → 0.75
// Meeple:   600px wide × 800px tall normalized frame → 0.75
const FRAME_RATIO: Partial<Record<RaceTypeId, number>> = {
  football: 0.75,
  board: 0.75,
};

// Finish line position as fraction of trackW (left edge of finish zone in each background image)
const FINISH_LINE: Partial<Record<RaceTypeId, number>> = {
  football: 0.889,
  board: 0.895, // left edge of FINISH panel in BG Field.png (x≈1720/1920)
};

// Start line position as fraction of trackW (the vertical line between START panel and racing area)
const START_LINE: Partial<Record<RaceTypeId, number>> = {
  board: 0.108, // right edge of START panel in BG Field.png (x≈207/1920)
};

function RaceLane({ participant, position, rank, finishRank, finished, racerW, flagW, raceType, laneH, spriteW, spriteSheetW, trackW, isWaiting }: {
  participant: Participant;
  position: number;
  rank: number;
  finishRank: number;
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
  const isBoard = raceType === 'board';
  const hasSpriteRacer = isFootball || isBoard;
  const finishFraction = FINISH_LINE[raceType];
  const startFraction = START_LINE[raceType] ?? 0;

  // Right edge of sprite sits on the start line at position=0 (character lined up behind it)
  const startLinePixel = Math.round(trackW * startFraction);
  const startPixel = Math.max(0, startLinePixel - spriteW);
  const finishLinePx = finishFraction != null ? Math.round(trackW * finishFraction) : null;
  // maxTravel: at pos=100 the sprite's left edge is at the finish line (body crossing it)
  const maxTravel = Math.max(0,
    finishLinePx != null
      ? finishLinePx - startPixel
      : trackW - racerW - flagW
  );
  const pixelPos = startPixel + Math.round((position / 100) * maxTravel);
  const trophyPixelPos = pixelPos + Math.round(spriteW / 2);

  // Spotlight triggers once the right edge is 10px inside the finish zone (past the line).
  const touchedFinish = hasSpriteRacer && finishLinePx != null
    ? pixelPos + spriteW >= finishLinePx + 10
    : finished;

  // Sprite sources — hooks must always be called unconditionally
  const footballSrc = useFootballSprite(
    isFootball ? `/football-player-${participant.id % 12}.png` : '',
    participant.color,
    participant.id
  );
  // Meeple: three separate images, one per animation frame
  const meepleStandSrc = useMeepleSprite(isBoard ? '/meeple-stand.png' : '', participant.color);
  const meepleRun1Src  = useMeepleSprite(isBoard ? '/meeple-run1.png'  : '', participant.color);
  const meepleRun2Src  = useMeepleSprite(isBoard ? '/meeple-run2.png'  : '', participant.color);

  const nameFontSize = hasSpriteRacer
    ? Math.min(20, Math.max(11, Math.round(laneH * 0.24)))
    : 13;

  // animFrame: 0 = standing (countdown/finished), 1 = run1, 2 = run2
  const [animFrame, setAnimFrame] = useState(0);
  useEffect(() => {
    if (!hasSpriteRacer) return;
    if (isWaiting || finished) { setAnimFrame(0); return; }
    setAnimFrame(1);
    const iv = setInterval(() => setAnimFrame(f => f === 1 ? 2 : 1), 120);
    return () => clearInterval(iv);
  }, [isWaiting, finished, hasSpriteRacer]);

  // Meeple swaps images; football shifts backgroundPosition across a sprite sheet
  const meepleFrameSrc = animFrame === 1 ? meepleRun1Src : animFrame === 2 ? meepleRun2Src : meepleStandSrc;
  const spriteSrc = isFootball ? footballSrc : meepleFrameSrc;
  const bgPosX = isFootball ? -(animFrame * spriteW) : 0;
  const spriteBgSize = isFootball ? `${spriteSheetW}px ${laneH}px` : `${spriteW}px ${laneH}px`;

  const spriteClass = isFootball ? 'football-sprite' : 'meeple-sprite';

  return (
    <div className="race-lane" style={hasSpriteRacer ? { height: laneH } : undefined}>
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
            color: hasSpriteRacer ? '#ffffff' : participant.color,
            textShadow: '0 1px 8px rgba(0,0,0,0.95)',
            pointerEvents: 'none',
          }}>
            {participant.name}
          </div>

          <div className="lane-racer" style={{
            position: 'relative', top: 'auto', transform: 'none',
            transition: 'none', willChange: 'auto',
            ...(hasSpriteRacer
              ? { width: spriteW, height: laneH }
              : { backgroundColor: participant.color }),
            boxShadow: !hasSpriteRacer && finished ? '0 0 20px 8px rgba(245,166,35,0.7)' : 'none',
          }}>
            {hasSpriteRacer ? (
              <>
                {touchedFinish && (
                  <div style={{
                    position: 'absolute', inset: -18,
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.4) 80%, transparent 100%)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }} />
                )}
                {isBoard ? (
                  // Meeple: all 3 frames pre-loaded, opacity toggles between them — no src swap delay
                  <div style={{ position: 'relative', width: spriteW, height: laneH, zIndex: 1 }}
                       className={touchedFinish ? 'sprite-finished' : ''}>
                    {([
                      { src: meepleStandSrc, frame: 0 },
                      { src: meepleRun1Src,  frame: 1 },
                      { src: meepleRun2Src,  frame: 2 },
                    ] as const).map(({ src, frame }) => (
                      <img
                        key={frame}
                        src={src}
                        width={spriteW}
                        height={laneH}
                        alt=""
                        style={{
                          display: 'block',
                          position: 'absolute', top: 0, left: 0,
                          objectFit: 'fill',
                          opacity: animFrame === frame ? 1 : 0,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  // Football: sprite sheet + backgroundPosition shift
                  <div
                    className={touchedFinish ? `${spriteClass} sprite-finished` : spriteClass}
                    style={{
                      backgroundImage: `url('${spriteSrc}')`,
                      width: spriteW,
                      height: laneH,
                      backgroundSize: spriteBgSize,
                      backgroundPosition: `${bgPosX}px 0px`,
                      position: 'relative', zIndex: 1,
                    }}
                  />
                )}
                {touchedFinish && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse at center, rgba(255,252,180,0.6) 0%, rgba(255,240,100,0.2) 50%, transparent 75%)',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }} />
                )}
              </>
            ) : (
              <>
                <span className="lane-initial">{participant.name[0].toUpperCase()}</span>
                {finished && <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>}
              </>
            )}
          </div>
        </div>

        {hasSpriteRacer && touchedFinish && (
          <div style={{
            position: 'absolute', bottom: '100%',
            left: `${trophyPixelPos}px`, transform: 'translateX(-50%)',
            zIndex: 10, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            {finishRank === 1 && <span style={{ fontSize: 14, lineHeight: 1 }}>🏆</span>}
            <span style={{
              fontFamily: 'var(--font-d)', fontWeight: 900,
              fontSize: Math.max(13, Math.round(laneH * 0.22)),
              lineHeight: 1,
              color: finishRank === 1 ? '#FFD700' : finishRank === 2 ? '#D8D8D8' : finishRank === 3 ? '#CD7F32' : '#ffffff',
              textShadow: '0 1px 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.9)',
            }}>#{finishRank}</span>
          </div>
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

  const raceData = useRef(simulateRace(participants.length, seed));
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const trackRef = useRef<HTMLDivElement>(null);

  const isFootball = raceType === 'football';
  const isBoard = raceType === 'board';
  const hasSpriteRacer = isFootball || isBoard;

  useEffect(() => {
    const check = () => {
      setMobile(window.innerWidth < 600);
      setPortrait(window.innerWidth < window.innerHeight && window.innerWidth < 900);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Measure track dimensions for any race type that uses a background image
  useLayoutEffect(() => {
    if (!hasSpriteRacer) return;
    const measure = () => {
      if (!trackRef.current) return;
      const labelW = mobile ? 50 : 72;
      setTrackH(trackRef.current.offsetHeight);
      setTrackW(trackRef.current.offsetWidth - labelW);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [hasSpriteRacer, mobile, participants.length]);

  const laneH = hasSpriteRacer
    ? Math.min(MAX_LANE_H, Math.floor(trackH / participants.length))
    : MAX_LANE_H;

  const frameRatio = FRAME_RATIO[raceType] ?? 0;
  const spriteW = hasSpriteRacer ? Math.max(18, Math.round(laneH * frameRatio)) : 0;
  const spriteSheetW = spriteW * SPRITE_FRAMES;
  const racerW = hasSpriteRacer ? spriteW : (mobile ? 40 : 108);
  const flagW = mobile ? 20 : 26;

  const bgGradient = isFootball
    ? { background: 'linear-gradient(180deg, #0c2414 0%, #183520 100%)' }
    : isBoard
    ? { background: 'linear-gradient(180deg, #060f3a 0%, #0d1a5a 100%)' }
    : {};

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

  // Finish rank from simulation order (accurate first/second/etc. based on finish tick)
  const finishRanks = new Array<number>(participants.length).fill(0);
  data.order.forEach((r, idx) => { finishRanks[r.idx] = idx + 1; });

  const trackClass = `race-track${isFootball ? ' football-field' : isBoard ? ' board-field' : ''}`;

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
    ...bgGradient,
  } : {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '22px 28px',
    gap: 16,
    ...bgGradient,
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
      <div ref={trackRef} className={trackClass} style={{ flex: 1, minHeight: 0 }}>
        {participants.map((p, i) => (
          <RaceLane
            key={p.id}
            participant={p}
            position={pos[i]}
            rank={ranks[i]}
            finishRank={finishRanks[i]}
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
