import type { RaceType, ThemeConfig } from '@/types';

export const RACER_COLORS = [
  '#E84C3D', '#2563EB', '#F59E0B', '#16A34A',
  '#9333EA', '#EC4899', '#0891B2', '#EA580C',
  '#84CC16', '#F43F5E', '#06B6D4', '#D97706',
];

export const RACE_TYPES: RaceType[] = [
  { id: 'football', label: 'Football Race', emoji: '🏈', short: 'FOOTBALL' },
];

export const THEMES: Record<string, ThemeConfig> = {
  warm: {
    id: 'warm',
    swatch: '#e84c3d',
    vars: {
      '--bg': '#f5f0e8', '--surface': '#ffffff', '--surface-alt': '#ede8e0',
      '--ink': '#1a1a2e', '--ink-muted': '#888899',
      '--accent': '#e84c3d', '--accent-alt': '#f5a623', '--accent-fg': '#ffffff',
      '--border': '#1a1a2e',
    },
  },
  night: {
    id: 'night',
    swatch: '#ff3b2e',
    vars: {
      '--bg': '#0d0d18', '--surface': '#1a1a2e', '--surface-alt': '#252540',
      '--ink': '#f5f0e8', '--ink-muted': '#9999aa',
      '--accent': '#ff3b2e', '--accent-alt': '#f5a623', '--accent-fg': '#ffffff',
      '--border': '#f5f0e8',
    },
  },
  broadcast: {
    id: 'broadcast',
    swatch: '#00c8ff',
    vars: {
      '--bg': '#071428', '--surface': '#0d2040', '--surface-alt': '#0f2a50',
      '--ink': '#ffffff', '--ink-muted': '#7799bb',
      '--accent': '#00c8ff', '--accent-alt': '#ffd700', '--accent-fg': '#000000',
      '--border': '#00c8ff',
    },
  },
};

export const REMOTE_MAX_PLAYERS = 24;
