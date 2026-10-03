import { X } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { LangduStep, type LangduResult } from '../activities/langdu/LangduStep';
import { PASSAGES } from '../content';
import { pickPassage, readingPool, type ReadingPassage } from '../langdu/cycle';
import { localDateKey } from '../lib/date';
import { newId } from '../lib/id';
import { addRecording, getKid, getSettings, listParentPassages } from '../store/repo';
import { DEFAULT_KID, type KidState, type OralInfo } from '../types';
import { InkIcon } from '../ui/icons/InkIcon';
import { currentWorld } from '../fun/worlds';
import { WorldStrip } from '../ui/worlds/WorldStrip';
import { useApp } from './AppContext';
import { loadKnowledge } from './knowledge';

interface Loaded { passage: ReadingPassage | null; oral: OralInfo; kid: KidState; knownChars: Set<string> }

/** An extra 朗读 round from Home: today's passage, no warm-up, no stars, no cycle day. */
export function LangduScreen() {
  const { db, now, go } = useApp();
  const [state, setState] = useState<Loaded | null>(null);

  useEffect(() => {
    void (async () => {
      const [know, kid, parent, settings] = await Promise.all([loadKnowledge(db), getKid(db), listParentPassages(db), getSettings(db)]);
      const k = kid ?? DEFAULT_KID;
      const passage = pickPassage(k.reading, readingPool(parent, PASSAGES, know.knownChars), localDateKey(now()));
      setState({ passage, oral: settings.oral, kid: k, knownChars: know.knownChars });
    })();
  }, []);

  useEffect(() => {
    if (state && !state.passage) go({ name: 'home' });
  }, [state]);

  if (!state?.passage) return <div class="screen loading"><InkIcon name="paw" size={88} label="加载中" /></div>;
  const passage = state.passage;

  const done = async (r: LangduResult) => {
    if (r.read) await addRecording(db, { id: newId(), createdAt: now().getTime(), prompt: { kind: 'passage', passageId: passage.id }, ...r.read });
    go({ name: 'home' });
  };

  return (
    <div class="screen">
      <WorldStrip world={currentWorld(state.kid)} />
      <header class="lessonbar">
        <button type="button" class="icon-btn" aria-label="回家" onClick={() => go({ name: 'home' })}>
          <X size={34} strokeWidth={3} />
        </button>
      </header>
      <LangduStep passage={passage} oral={state.oral} warmups={state.kid.reading.warmups} knownChars={state.knownChars} kid={state.kid} withWarmup={false} onDone={(r) => void done(r)} />
    </div>
  );
}
