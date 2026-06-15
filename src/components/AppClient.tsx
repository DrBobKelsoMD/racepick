'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Sync screen state with browser history so the back button works within the app
  useEffect(() => {
    history.replaceState({ screen: 'home' }, '');
    const handlePop = (e: PopStateEvent) => {
      setScreen((e.state?.screen as Screen) ?? 'home');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // If the browser back button lands on a screen that needs state we've since cleared, go home
  useEffect(() => {
    if (screen === 'results' && !results) {
      history.replaceState({ screen: 'home' }, '');
      setScreen('home');
    } else if (screen === 'race' && seed === null) {
      history.replaceState({ screen: 'home' }, '');
      setScreen('home');
    }
  }, [screen, results, seed]);

  // Forward navigation: push a history entry so the browser back button can unwind it
  const goTo = useCallback((s: Screen) => {
    history.pushState({ screen: s }, '');
    setScreen(s);
  }, []);

  // Back navigation: let the browser pop its own history, which fires popstate → setScreen
  const goBack = useCallback(() => history.back(), []);

  const handleModeSelect = async (m: Mode) => {
    setMode(m);
    goTo('setup');
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
        goTo('remoteLobby');
      } catch {
        alert('Failed to create room. Add your Supabase URL and key to .env.local and restart.');
      }
      return;
    } else {
      goTo('prerace');
    }
  };

  const handleLobbyLaunch = (ps: Participant[], rt: RaceTypeId, s: number) => {
    setParticipants(ps);
    setRaceType(rt);
    setSeed(s);
    goTo('race');
  };

  const handleStartRace = () => { setSeed(generateSeed()); goTo('race'); };
  const handleRaceFinish = (order: RaceResult[]) => { setResults(order); goTo('results'); };
  const handleRaceAgain = () => { setResults(null); setSeed(generateSeed()); goTo('race'); };
  const handleDone = () => {
    setParticipants([]); setResults(null); setSeed(null); setRoom(null); setTitle('');
    goTo('home');
  };

  return (
    <>
      <ThemeSwitcher theme={theme} onChange={setTheme} />

      {screen === 'home' && <HomeScreen onSelect={handleModeSelect} />}

      {screen === 'setup' && (
        <SetupScreen mode={mode} onBack={goBack} onStart={handleSetupDone} />
      )}

      {screen === 'remoteLobby' && room && (
        <RemoteLobbyScreen room={room} onBack={goBack} onLaunch={handleLobbyLaunch} />
      )}

      {screen === 'prerace' && (
        <PreRaceScreen
          participants={participants}
          raceType={raceType}
          title={title || undefined}
          onBack={goBack}
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
