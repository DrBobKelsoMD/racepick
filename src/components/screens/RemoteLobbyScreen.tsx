'use client';

import { useState, useEffect, useCallback } from 'react';
import Logo from '@/components/Logo';
import { supabase, getParticipants, joinRoom, startRace } from '@/lib/supabase';
import { generateSeed } from '@/lib/simulation';
import { RACER_COLORS } from '@/lib/constants';
import type { Participant, RoomRow, RaceTypeId } from '@/types';

interface RemoteLobbyScreenProps {
  room: RoomRow;
  onBack: () => void;
  onLaunch: (participants: Participant[], raceType: RaceTypeId, seed: number) => void;
}

export default function RemoteLobbyScreen({ room, onBack, onLaunch }: RemoteLobbyScreenProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hostName, setHostName] = useState('');
  const [hostJoined, setHostJoined] = useState(false);

  const loadParticipants = useCallback(async () => {
    const rows = await getParticipants(room.id);
    setParticipants(
      rows.map((r, i) => ({ id: i, name: r.name, color: RACER_COLORS[i % RACER_COLORS.length] }))
    );
  }, [room.id]);

  useEffect(() => {
    loadParticipants();

    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_participants', filter: `room_id=eq.${room.id}` }, loadParticipants)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id, loadParticipants]);

  const handleHostJoin = async () => {
    const name = hostName.trim();
    if (!name) return;
    const color = RACER_COLORS[0];
    await joinRoom(room.id, name, color);
    setHostJoined(true);
  };

  const handleLaunch = async () => {
    if (participants.length < 2) return;
    const seed = generateSeed();
    await startRace(room.id, seed);
    onLaunch(participants, room.race_type, seed);
  };

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${room.code}`
    : `racepick.app/room/${room.code}`;

  return (
    <div className="screen" style={{ maxWidth: 560 }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>←</button>
        <Logo size="sm" />
        <span style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          Remote Lobby
        </span>
      </div>

      {/* Room code */}
      <div>
        <span className="label">Room Code</span>
        <div className="room-code">{room.code}</div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 8 }}>
          {joinUrl}
        </div>
      </div>

      {/* Host join */}
      {!hostJoined ? (
        <div>
          <span className="label">Join as Host</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Your name…"
              value={hostName}
              maxLength={20}
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHostJoin()}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleHostJoin} disabled={!hostName.trim()}>
              Join
            </button>
          </div>
        </div>
      ) : null}

      {/* Participant list */}
      <div>
        <span className="label">
          Participants <span style={{ color: 'var(--accent)' }}>{participants.length}</span>
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {participants.map((p, i) => (
            <div key={p.id} className="lobby-row" style={{ animation: 'slideIn 0.3s ease-out both' }}>
              <span className="lobby-check">✓</span>
              <span className="lobby-name">{p.name}</span>
              {i === 0 && <span className="badge" style={{ marginLeft: 'auto' }}>HOST</span>}
            </div>
          ))}
          <div className="lobby-row" style={{ opacity: 0.5 }}>
            <div className="spinner" />
            <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--ink-muted)' }}>
              Waiting for players…
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button className="btn btn-primary btn-lg w-full" onClick={handleLaunch} disabled={participants.length < 2}>
          🚀 Launch Race
        </button>
      </div>
    </div>
  );
}
