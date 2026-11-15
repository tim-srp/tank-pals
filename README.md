# 小蓝坦克

A gentle tank game for kids, made for iPad. It installs from Safari: Share → 添加到主屏幕. No App Store, signing or account needed, and it works offline after the first visit.

- 100 levels in 10 worlds. Each world has its own story, number rule, fun fact and a big robot at level 10.
- Story: 乱码云 scrambled the robots' sleep chips. 小蓝 uses 晚安能量球 to help them nap, and they wake up as friends. In the end 乱码云 becomes a friend too.
- English first, from zero (英语 60 levels, 语文 20, 数学 20). Each world teaches 8 new words in two batches with picture cards from Bee 老师 (read twice in English, then Chinese), plus letters. Practice moves from listening (worlds 1–2) to reading words (3–6) to short sentences (7–10). Letters go A–Z → first sounds → upper/lower case → spelling. Practice and boss levels bring back words the child missed (right/wrong counts per word, kept on this device). A 📒 word book on the home screen lets the child hear every word learned. 语文 (认字, 古诗) and 数学 (later asked in English) support it. A wrong robot still falls asleep, with no penalty. See docs/curriculum.md (`node scripts/curriculum.mjs`).
- All progress, settings and word stats stay on the device (localStorage). Nothing is uploaded.
- Background music: original tunes synthesized live with WebAudio, a different tune per world and a livelier one for boss levels.
- Full screen: a button on the home screen, and starting the adventure enters Safari full screen. The home-screen app is always full screen.
- Parent settings (behind a multiplication question): daily level limit, daily minute limit (the child finishes the current level first), voice, music and sound, unlock all, reset.

## Develop

```
npm install
npx playwright install chromium webkit
npm run serve        # http://localhost:8765/
npm test             # unit tests + end-to-end tests (Chromium multi-touch + WebKit) at iPad size
npm run icons        # regenerate icons/
```

Plain HTML/CSS/JS, no build step. `src/story.js` holds the worlds and story, `src/levels.js` the seeded level generator, and `src/game.js` the game.
