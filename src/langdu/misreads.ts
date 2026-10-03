import { addExtraDay } from './cycle';
import { getCard, getKid, getWord, putCards, putWords, saveKid, updateRecording } from '../store/repo';
import type { AppDb } from '../store/db';
import type { Recording } from '../types';

/**
 * The parent confirmed which characters he misread in a 朗读 recording: each becomes a priority word
 * (an existing card is due now; otherwise the built-in word jumps to the front of new words), and the
 * passage gets one extra day if it is still today's passage.
 */
export async function applyMisreads(db: AppDb, recording: Recording, chars: string[], now: Date): Promise<void> {
  await updateRecording(db, { ...recording, misread: chars });
  for (const ch of chars) {
    const id = `b:${ch}`;
    const card = await getCard(db, `${id}:recognise`);
    if (card) {
      await putCards(db, [{ ...card, fsrs: { ...card.fsrs, due: now } }]);
      continue;
    }
    const word = await getWord(db, id);
    if (word) await putWords(db, [{ ...word, listedAt: now.getTime() }]);
  }
  if (chars.length && recording.prompt.kind === 'passage') {
    const kid = await getKid(db);
    if (kid) await saveKid(db, { ...kid, reading: addExtraDay(kid.reading, recording.prompt.passageId) });
  }
}
