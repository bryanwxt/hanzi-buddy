import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../app/AppContext';
import { loadKnowledge } from '../app/knowledge';
import { goalProgress } from '../fun/rewards';
import { totalStars } from '../stats/stats';
import { allSessions, deleteReward, getKid, listRewards, saveReward } from '../store/repo';
import type { RewardGoal } from '../types';
import { newId } from '../lib/id';

const EMOJIS = ['🍦', '🧸', '🎮', '📚', '🏊', '🍕', '🎬', '🧩', '🎨', '⚽'];

export function RewardsPanel() {
  const { db, now } = useApp();
  const [goals, setGoals] = useState<RewardGoal[]>([]);
  const [stats, setStats] = useState({ stars: 0, known: 0 });
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]!);
  const [metric, setMetric] = useState<RewardGoal['metric']>('stars');
  const [target, setTarget] = useState('100');

  const load = async () => {
    const [g, sessions, know, kid] = await Promise.all([listRewards(db), allSessions(db), loadKnowledge(db), getKid(db)]);
    setGoals(g);
    setStats({ stars: totalStars(sessions, kid?.bonusStars ?? 0), known: know.known });
  };
  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    const n = Math.round(Number(target));
    if (!title.trim() || !(n >= 1)) return;
    await saveReward(db, { id: newId(), title: title.trim(), emoji, metric, target: n, createdAt: now().getTime(), claimedAt: null });
    setTitle('');
    await load();
  };
  const claim = async (g: RewardGoal) => {
    await saveReward(db, { ...g, claimedAt: now().getTime() });
    await load();
  };
  const remove = async (g: RewardGoal) => {
    if (!confirm(`Delete the goal "${g.title}"?`)) return;
    await deleteReward(db, g.id);
    await load();
  };

  return (
    <>
      <section class="panel">
        <h2>Add a reward goal</h2>
        <p>Your child sees the next unclaimed goal on the home screen with a progress bar. Stars are never spent — goals are milestones.</p>
        <div class="field">
          <label for="rw-title">Reward</label>
          <input id="rw-title" value={title} placeholder="e.g. Ice cream outing" onInput={(e) => setTitle(e.currentTarget.value)} />
        </div>
        <div class="row" style={{ justifyContent: 'flex-start' }}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" class={`swatch ${e === emoji ? 'is-on' : ''}`} style={{ width: '56px', height: '56px', fontSize: '30px' }} aria-label={e} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
        <div class="row" style={{ justifyContent: 'flex-start' }}>
          <div class="field">
            <label for="rw-metric">Measure</label>
            <select id="rw-metric" value={metric} onChange={(e) => setMetric(e.currentTarget.value as RewardGoal['metric'])}>
              <option value="stars">Stars ⭐ (now {stats.stars})</option>
              <option value="known">Characters known (now {stats.known})</option>
            </select>
          </div>
          <div class="field">
            <label for="rw-target">Target</label>
            <input id="rw-target" inputMode="numeric" value={target} onInput={(e) => setTarget(e.currentTarget.value)} />
          </div>
        </div>
        <button type="button" class="btn btn--primary" onClick={() => void add()}>Add goal</button>
      </section>
      <section class="panel">
        <h2>Goals</h2>
        {goals.length === 0 ? (
          <p>No goals yet.</p>
        ) : (
          <table class="table">
            <tbody>
              {goals.map((g) => {
                const p = goalProgress(g, stats);
                return (
                  <tr key={g.id}>
                    <td style={{ fontSize: '28px' }}>{g.emoji}</td>
                    <td>{g.title}</td>
                    <td>{p.value} / {g.target} {g.metric === 'stars' ? '⭐' : 'characters'}</td>
                    <td>
                      {g.claimedAt ? `Given ${new Date(g.claimedAt).toLocaleDateString()}`
                        : p.reached ? <button type="button" class="small-btn" onClick={() => void claim(g)}>Mark as given</button>
                        : 'In progress'}
                    </td>
                    <td><button type="button" class="small-btn" onClick={() => void remove(g)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
