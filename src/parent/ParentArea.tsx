import { useState } from 'preact/hooks';
import { useApp } from '../app/AppContext';
import { BackupPanel } from './BackupPanel';
import { Credits } from './Credits';
import { Dashboard } from './Dashboard';
import { PicturesPanel } from './PicturesPanel';
import { PinGate } from './PinGate';
import { RecordingsPanel } from './RecordingsPanel';
import { RewardsPanel } from './RewardsPanel';
import { SettingsPanel } from './SettingsPanel';
import { WordsPanel } from './WordsPanel';

export type ParentTab = 'dashboard' | 'words' | 'recordings' | 'pictures' | 'rewards' | 'settings' | 'backup' | 'credits';

const TABS: [ParentTab, string][] = [
  ['dashboard', 'Overview'],
  ['words', 'Words'],
  ['recordings', 'Recordings'],
  ['pictures', 'Pictures'],
  ['rewards', 'Rewards'],
  ['settings', 'Settings'],
  ['backup', 'Backup'],
  ['credits', 'Credits'],
];

export function ParentArea() {
  const { go } = useApp();
  const [tab, setTab] = useState<ParentTab>('dashboard');
  return (
    <PinGate>
      <div class="screen parent">
        <header class="topbar">
          <button type="button" class="btn btn--ghost" onClick={() => go({ name: 'home' })}>← Done</button>
          <nav class="tabs">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" class={`tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </nav>
        </header>
        <main class="parent__body">
          {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
          {tab === 'words' && <WordsPanel />}
          {tab === 'recordings' && <RecordingsPanel />}
          {tab === 'pictures' && <PicturesPanel />}
          {tab === 'rewards' && <RewardsPanel />}
          {tab === 'settings' && <SettingsPanel />}
          {tab === 'backup' && <BackupPanel />}
          {tab === 'credits' && <Credits />}
        </main>
      </div>
    </PinGate>
  );
}
