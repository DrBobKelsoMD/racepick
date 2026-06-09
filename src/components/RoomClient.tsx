'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import RaceScreen from '@/components/screens/RaceScreen';
import { getRoom, joinRoom, getParticipants, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatSeed } from '@/lib/simulation';
import { RACER_COLORS } from '@/lib/constants';
import type { RoomRow, Participant, RaceResult, RaceTypeId } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

function ParticipantResults({ order, participants, seed }: {
  order: RaceResult[];
  participants: Participant[];
  seed: number;
}) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setVisible(i); if (i >= order.length) clearInterval(t); }, 270);
    return () => clearInterval(t);
  }, [order.length]);

  return (
    <div className="screen">
      <Logo size="sm" />
      <div className="page-title">Final Order</div>
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
      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--ink-muted)', textAlign: 'center', letterSpacing: '0.1em', marginTop: 'auto' }}>
        SEED {formatSeed(seed)}
      </div>
    </div>
  );
}

interface RoomClientProps { code: string; }

export default function RoomClient({ code }: RoomClientProps) {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<'loading' | 'notfound' | 'waiting' | 'racing' | 'done'>('loading');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setStatus('notfound'); return; }
    async function init() {
      try {
        const r = await getRoom(code);
        if (!r) { setStatus('notfound'); return; }
        setRoom(r);
        setStatus(r.status as typeof status);
      } catch {
        setStatus('notfound');
      }
    }
    init();
  }, [code]);

  // Watch for race start via real-time
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-status-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        const updated = payload.new as RoomRow;
        setRoom(updated);
        if (updated.status === 'racing') setStatus('racing');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  // When race starts, fetch participants so the race screen can render
  useEffect(() => {
    if (status !== 'racing' || !room?.id) return;
    getParticipants(room.id).then((rows) => {
      setParticipants(
        rows.map((r, i) => ({ id: i, name: r.name, color: RACER_COLORS[i % RACER_COLORS.length] }))
      );
    });
  }, [status, room?.id]);

  const handleJoin = async () => {
    if (!room || !name.trim()) return;
    const color = RACER_COLORS[Math.floor(Math.random() * RACER_COLORS.length)];
    const result = await joinRoom(room.id, name.trim(), color);
    if (result) setJoined(true);
  };

  const handleRaceFinish = (order: RaceResult[]) => {
    setRaceResults(order);
    setStatus('done');
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo />
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
        <Logo size="md" />
        <div className="page-title" style={{ color: 'var(--accent)' }}>Room Not Found</div>
        <p style={{ fontFamily: 'var(--font-m)', fontSize: 13, color: 'var(--ink-muted)' }}>
          Check the room code and try again.
        </p>
      </div>
    );
  }

  if (status === 'done' && raceResults && participants.length > 0) {
    return <ParticipantResults order={raceResults} participants={participants} seed={room!.seed!} />;
  }

  // Show the actual race — same deterministic simulation as the host
  if (status === 'racing' && participants.length > 0 && room?.seed) {
    return (
      <RaceScreen
        key={room.seed}
        participants={participants}
        raceType={room.race_type as RaceTypeId}
        seed={room.seed}
        onFinish={handleRaceFinish}
      />
    );
  }

  // Racing but participants not loaded yet — brief spinner
  if (status === 'racing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Logo />
        <div className="spinner" />
      </div>
    );
  }

  if (joined) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
        <Logo size="md" />
        <div className="page-title">You&apos;re In!</div>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p style={{ fontFamily: 'var(--font-m)', fontSize: 13, color: 'var(--ink-muted)' }}>
          Waiting for the host to launch the race…
        </p>
        <div style={{
          fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 28, letterSpacing: '0.1em',
          color: 'var(--accent)', border: '2px solid var(--border)', padding: '8px 20px',
          borderRadius: 3, boxShadow: '3px 3px 0 var(--border)',
        }}>
          {name.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ maxWidth: 480 }}>
      <Logo size="md" />
      <div>
        <div className="page-title">Join Room</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span className="label" style={{ margin: 0 }}>Room</span>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 900, fontSize: 22, letterSpacing: '0.12em', color: 'var(--accent)' }}>
            {code.toUpperCase()}
          </span>
        </div>
      </div>
      <div>
        <span className="label">Your Name</span>
        <input
          className="input"
          placeholder="Enter your name…"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          autoFocus
        />
      </div>
      <button className="btn btn-primary btn-lg w-full" onClick={handleJoin} disabled={!name.trim()}>
        ✓ Join Race
      </button>
    </div>
  );
}
