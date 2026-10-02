import { useState } from 'preact/hooks';
import { saveTextFile } from '../lib/files';
import { exportRawBackup } from '../store/backup';

export function ErrorScreen({ message, dbName }: { message: string; dbName: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const save = async () => {
    try {
      await saveTextFile('hanzi-buddy-emergency-copy.json', await exportRawBackup(dbName));
      setStatus('Saved.');
    } catch (e) {
      setStatus(`Could not save: ${String(e)}`);
    }
  };
  return (
    <div class="screen parent">
      <div class="center">
        <div style={{ fontSize: '80px' }}>🥚💤</div>
        <h1>Something went wrong opening the app</h1>
        <p>Your child's progress has not been deleted. Please don't remove the app. Save an emergency copy of the data, then try reopening.</p>
        <p><small>{message}</small></p>
        <button type="button" class="btn btn--primary" onClick={() => void save()}>Save emergency copy</button>
        {status && <p>{status}</p>}
      </div>
    </div>
  );
}
