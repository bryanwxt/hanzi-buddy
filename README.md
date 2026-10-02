# 汉字小伙伴 Hanzi Buddy

A home-screen iPad app for daily Chinese character practice (P2 → P3), used by the child alone:
spaced-repetition flashcards ("feed the dragon"), 听写 writing, a components fishing game, and speaking recordings,
with a pet dragon that grows as more characters are learned. Parents use the 🔒 PIN-protected area for
progress, school word lists, recordings, reward goals, settings and backups. All data stays on the iPad.

Design: `docs/superpowers/specs/2026-10-02-hanzi-buddy-design.md` · Plan: `docs/superpowers/plans/2026-10-02-hanzi-buddy.md`

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN for testing on the iPad)
npm test
npm run build
npm run content    # regenerate src/content/builtin.json from HSK 3.0 + Make Me a Hanzi
```

## Put it on the iPad

1. Open the deployed URL in **Safari** on the iPad.
2. Tap **Share → Add to Home Screen**. Always open the app from that icon. Home-screen apps keep their data and work offline.
3. First launch: set the parent PIN, let your child name the dragon, then do the 5-minute placement check together.
4. For good audio, install a Chinese voice: **Settings → Accessibility → Spoken Content → Voices → Chinese (China mainland)**.
5. Back up from the parent area every couple of weeks (Backup → Save backup file → Save to Files / iCloud Drive).

## iPad checklist (only real hardware can confirm these)

- [ ] 🔊 buttons speak Mandarin (not silence or an English voice).
- [ ] Speaking step: allow the microphone, record, play back, save. The recording plays in Parent → Recordings.
- [ ] 听写: finger writing is accepted; after 2 wrong strokes a hint appears.
- [ ] Add to Home Screen works; the app opens full-screen with the orange icon.
- [ ] Turn on Airplane Mode after one full session online: the app still opens, and flashcards and writing still work.
- [ ] Swipe the app away mid-session and reopen: it continues at the same card.
- [ ] Rotate to portrait: everything still fits.
