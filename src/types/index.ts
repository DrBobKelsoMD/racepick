export type Theme = 'warm' | 'night' | 'broadcast';
export type RaceTypeId = 'horse' | 'car' | 'boat';
export type Screen = 'home' | 'setup' | 'remoteLobby' | 'prerace' | 'race' | 'results';
export type Mode = 'inperson' | 'remote';

export interface Participant {
  id: number;
  name: string;
  color: string;
}

export interface RaceType {
  id: RaceTypeId;
  label: string;
  emoji: string;
  short: string;
}

export interface ThemeConfig {
  id: Theme;
  swatch: string;
  vars: Record<string, string>;
}

export interface RaceResult {
  idx: number;
  tick: number;
}

export interface RaceData {
  positions: number[][];
  order: RaceResult[];
  totalTicks: number;
}

export interface RoomRow {
  id: string;
  code: string;
  race_type: RaceTypeId;
  status: 'waiting' | 'racing' | 'done';
  seed: number | null;
  title: string | null;
  created_at: string;
}

export interface RoomParticipantRow {
  id: string;
  room_id: string;
  name: string;
  color: string;
  joined_at: string;
}
