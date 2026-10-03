import { Fragment } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from '../app/AppContext';
import { PASSAGES } from '../content';
import { applyMisreads } from '../langdu/misreads';
import { displayText } from '../langdu/phrases';
import { deleteRecording, listParentPassages, listRecordings } from '../store/repo';
import type { ParentPassage, Recording } from '../types';

const KEEP = 100;
const HAN = /\p{Script=Han}/u;

type Texts = Map<string, { title: string; text: string }>;

const describe = ({ prompt }: Recording, texts: Texts) => {
  if (prompt.kind === 'picture') return '📷 Picture talk';
  if (prompt.kind === 'intro') return '🙋 Self-introduction';
  if (prompt.kind === 'story' || prompt.kind === 'answer') return '🖼️ Picture story';
  const t = texts.get(prompt.passageId);
  return t ? `📖 ${t.title}` : '📖 (deleted text)';
};

/** Tap the characters he misread; saving makes them priority words and gives the passage an extra day. */
function MisreadMarker({ recording, text, onSaved }: { recording: Recording; text: string; onSaved: () => Promise<void> }) {
  const { db, now } = useApp();
  const [marked, setMarked] = useState<Set<string>>(new Set(recording.misread ?? []));
  const [saved, setSaved] = useState<number | null>(null);
  const toggle = (ch: string) => {
    const next = new Set(marked);
    if (next.has(ch)) next.delete(ch);
    else next.add(ch);
    setMarked(next);
    setSaved(null);
  };
  const save = async () => {
    await applyMisreads(db, recording, [...marked], now());
    setSaved(marked.size);
    await onSaved();
  };
  return (
    <div class="misreads">
      <p class="misreads__text">
        {[...displayText(text)].map((ch, i) =>
          HAN.test(ch) ? (
            <button key={i} type="button" class={`misread-ch${marked.has(ch) ? ' is-on' : ''}`} aria-pressed={marked.has(ch)} onClick={() => toggle(ch)}>{ch}</button>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </p>
      <button type="button" class="small-btn" onClick={() => void save()}>Save misread characters</button>
      {saved !== null && <span class="misreads__done"> Saved: {saved} character{saved === 1 ? '' : 's'} will come up in practice.</span>}
    </div>
  );
}

export function RecordingsPanel() {
  const { db } = useApp();
  const [recs, setRecs] = useState<Recording[]>([]);
  const [parent, setParent] = useState<ParentPassage[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const reload = async () => {
    const [r, p] = await Promise.all([listRecordings(db), listParentPassages(db)]);
    setRecs(r);
    setParent(p);
  };
  const texts: Texts = useMemo(() => new Map([...PASSAGES, ...parent].map((p) => [p.id, { title: p.title, text: p.text }])), [parent]);
  useEffect(() => {
    void reload();
  }, []);
  const urls = useMemo(() => recs.map((r) => URL.createObjectURL(r.blob)), [recs]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const remove = async (r: Recording) => {
    if (!confirm('Delete this recording?')) return;
    await deleteRecording(db, r.id);
    await reload();
  };
  const pruneOld = async () => {
    const old = recs.slice(KEEP);
    if (!confirm(`Delete the ${old.length} oldest recordings?`)) return;
    for (const r of old) await deleteRecording(db, r.id);
    await reload();
  };

  return (
    <section class="panel">
      <h2>Recordings</h2>
      {recs.length > KEEP && (
        <p class="warning">
          {recs.length} recordings saved.{' '}
          <button type="button" class="small-btn" onClick={() => void pruneOld()}>Delete the oldest {recs.length - KEEP}</button>
        </p>
      )}
      {recs.length === 0 ? (
        <p>No recordings yet. They appear here after the speaking step.</p>
      ) : (
        <table class="table">
          <tbody>
            {recs.map((r, i) => {
              const text = r.prompt.kind === 'passage' ? texts.get(r.prompt.passageId)?.text : undefined;
              return (
              <Fragment key={r.id}>
              <tr>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  {describe(r, texts)}
                  {r.misread?.length ? <small> · misread: {r.misread.join(' ')}</small> : null}
                  {text && <> <button type="button" class="small-btn" onClick={() => setOpen(open === r.id ? null : r.id)}>Mark misreads</button></>}
                </td>
                <td>{r.durationSec}s</td>
                <td><audio controls preload="none" src={urls[i]} /></td>
                <td><button type="button" class="small-btn" onClick={() => void remove(r)}>Delete</button></td>
              </tr>
              {open === r.id && text && (
                <tr>
                  <td colSpan={5}><MisreadMarker recording={r} text={text} onSaved={reload} /></td>
                </tr>
              )}
              </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
