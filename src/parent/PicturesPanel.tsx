import { useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from '../app/AppContext';
import { addPrompt, deletePrompt, listPrompts } from '../store/repo';
import type { PicturePrompt } from '../types';
import { newId } from '../lib/id';

export function PicturesPanel() {
  const { db, now } = useApp();
  const [items, setItems] = useState<PicturePrompt[]>([]);
  const reload = async () => setItems(await listPrompts(db));
  useEffect(() => {
    void reload();
  }, []);
  const urls = useMemo(() => items.map((p) => URL.createObjectURL(p.blob)), [items]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  const add = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      await addPrompt(db, { id: newId(), createdAt: now().getTime(), blob: file, mime: file.type });
    }
    await reload();
  };
  const remove = async (p: PicturePrompt) => {
    if (!confirm('Delete this picture?')) return;
    await deletePrompt(db, p.id);
    await reload();
  };

  return (
    <section class="panel">
      <h2>Pictures for 看图说话</h2>
      <p>Add photos, e.g. picture-composition pages from assessment books. The speaking step alternates between these and read-aloud passages.</p>
      <div class="field">
        <label for="pic-add">Add pictures</label>
        <input id="pic-add" type="file" accept="image/*" multiple onChange={(e) => void add(e.currentTarget.files)} />
      </div>
      <div class="thumbs">
        {items.map((p, i) => (
          <figure key={p.id} style={{ margin: 0 }}>
            <img src={urls[i]} alt="" />
            <button type="button" class="small-btn" onClick={() => void remove(p)}>Delete</button>
          </figure>
        ))}
      </div>
    </section>
  );
}
