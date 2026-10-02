import { useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from '../app/AppContext';
import { PASSAGES } from '../content';
import { deleteRecording, listRecordings } from '../store/repo';
import type { Recording } from '../types';

const KEEP = 100;

const describe = ({ prompt }: Recording) => {
  if (prompt.kind === 'picture') return '📷 Picture talk';
  const { passageId } = prompt;
  return `📖 ${PASSAGES.find((p) => p.id === passageId)?.title ?? 'Passage'}`;
};

export function RecordingsPanel() {
  const { db } = useApp();
  const [recs, setRecs] = useState<Recording[]>([]);
  const reload = async () => setRecs(await listRecordings(db));
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
            {recs.map((r, i) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{describe(r)}</td>
                <td>{r.durationSec}s</td>
                <td><audio controls preload="none" src={urls[i]} /></td>
                <td><button type="button" class="small-btn" onClick={() => void remove(r)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
