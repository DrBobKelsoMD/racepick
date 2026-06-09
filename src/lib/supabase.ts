import { createClient } from '@supabase/supabase-js';
import type { RoomRow, RoomParticipantRow } from '@/types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, key);

export const isSupabaseConfigured =
  url !== 'https://placeholder.supabase.co' &&
  url.startsWith('https://');

// ── Rooms ──────────────────────────────────────────────

export async function createRoom(raceType: string): Promise<RoomRow | null> {
  const code = generateRoomCode();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ code, race_type: raceType, status: 'waiting' })
    .select()
    .single();
  if (error) { console.error('createRoom:', error); return null; }
  return data;
}

export async function getRoom(code: string): Promise<RoomRow | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase())
    .single();
  if (error) return null;
  return data;
}

export async function startRace(roomId: string, seed: number): Promise<void> {
  await supabase
    .from('rooms')
    .update({ status: 'racing', seed })
    .eq('id', roomId);
}

export async function finishRace(roomId: string): Promise<void> {
  await supabase.from('rooms').update({ status: 'done' }).eq('id', roomId);
}

// ── Participants ────────────────────────────────────────

export async function getParticipants(roomId: string): Promise<RoomParticipantRow[]> {
  const { data, error } = await supabase
    .from('room_participants')
    .select()
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error) return [];
  return data;
}

export async function joinRoom(
  roomId: string,
  name: string,
  color: string,
): Promise<RoomParticipantRow | null> {
  const { data, error } = await supabase
    .from('room_participants')
    .insert({ room_id: roomId, name, color })
    .select()
    .single();
  if (error) { console.error('joinRoom:', error); return null; }
  return data;
}

// ── Utilities ───────────────────────────────────────────

function generateRoomCode(): string {
  const words = [
    'WOLF','BEAR','HAWK','LION','DART','BOLT','RUSH','BLAZE',
    'STORM','SWIFT','ACE','APEX','ZEAL','IRON','GOLD','SILVER',
  ];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${word}${num}`;
}
