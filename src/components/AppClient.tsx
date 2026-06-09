'use client';

import { useState, useEffect } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import HomeScreen from '@/components/screens/HomeScreen';
import SetupScreen from '@/components/screens/SetupScreen';
import RemoteLobbyScreen from '@/components/screens/RemoteLobbyScreen';
import PreRaceScreen from '@/components/screens/PreRaceScreen';
import RaceScreen from '@/components/screens/RaceScreen';
import ResultsScreen from '@/components/screens/ResultsScreen';
import { THEMES } from '@/lib/constants';
import { createRoom } from '@/lib/supabase';
import { generateSeed } from '@/lib/simulation';
import type { Screen, Mode, Theme, Participant, RaceTypeId, RaceResult, RoomRow } from '@/types';

export default function AppClient() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<Mode>('inperson');
  const [theme, setTheme] = useState<Theme>('warm');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [raceType, setRaceType] = useState<RaceTypeId>('football');
  const [title, setTitle] = useState('');
  const [seed, setSeed] = useState<number | null>(null);
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [room, setRoom] = useState<RoomRow | null>(null);

  useEffect(() => {
    const vars = THEMES[theme].vars;
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  }, [theme]);

  const handleModeSelect = async (m: Mode) => {
    setMode(m);
    setScreen('setup');
  };

  const handleSetupDone = async (data: { participants: Participant[]; raceType: RaceTypeId; title: string }) => {
    setParticipants(data.participants);
    setRaceType(data.raceType);
    setTitle(data.title);
    if (mode === 'remote') {
      try {
        const newRoom = await createRoom(data.raceType, data.title);
        if (!newRoom) throw new Error('null room');
        setRoom(newRoom);
        setScreen('remoteLobby');
      } catch {
        alert('Failed to create room. Add your Supabase URL and key to .env.local and restart.');
      }
      return;
    } else {
      setScreen('prerace');
    }
  };

  const handleLobbyLaunch = (ps: Participant[], rt: RaceTypeId, s: number) => {
    setParticipants(ps);
    setRaceType(rt);
    setSeed(s);
    setScreen('race');
  };

  const handleStartRace = () => { setSeed(generateSeed()); setScreen('race'); };
  const handleRaceFinish = (order: RaceResult[]) => { setResults(order); setScreen('results'); };
  const handleRaceAgain = () => { setResults(null); setSeed(generateSeed()); setScreen('race'); };
  const handleDone = () => { setScreen('home'); setParticipants([]); setResults(null); setSeed(null); setRoom(null); setTitle(''); };

  return (
    <>
      <ThemeSwitcher theme={theme} onChange={setTheme} />

      {screen === 'home' && <HomeScreen onSelect={handleModeSelect} />}

      {screen === 'setup' && (
        <SetupScreen mode={mode} onBack={() => setScreen('home')} onStart={handleSetupDone} />
      )}

      {screen === 'remoteLobby' && room && (
        <RemoteLobbyScreen room={room} onBack={() => setScreen('setup')} onLaunch={handleLobbyLaunch} />
      )}

      {screen === 'prerace' && (
        <PreRaceScreen
          participants={participants}
          raceType={raceType}
          title={title || undefined}
          onBack={() => setScreen(mode === 'remote' ? 'remoteLobby' : 'setup')}
          onStartRace={handleStartRace}
        />
      )}

      {screen === 'race' && seed !== null && (
        <RaceScreen
          key={seed}
          participants={participants}
          raceType={raceType}
          seed={seed}
          title={title || undefined}
          onFinish={handleRaceFinish}
        />
      )}

      {screen === 'results' && results && (
        <ResultsScreen
          order={results}
          participants={participants}
          raceType={raceType}
          title={title || undefined}
          onRaceAgain={handleRaceAgain}
          onDone={handleDone}
        />
      )}
    </>
  );
}
