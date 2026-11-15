# 小蓝坦克

A gentle tank game for kids, made for iPad. It installs from Safari: Share → 添加到主屏幕. No App Store, signing or account needed, and it works offline after the first visit.

- 100 levels in 10 worlds. Each world has its own story, number rule, fun fact and a big robot at level 10.
- Story: 乱码云 scrambled the robots' sleep chips. 小蓝 uses 晚安能量球 to help them nap, and they wake up as friends. In the end 乱码云 becomes a friend too.
- Grade 1–2 lessons in every level (语文 55, 数学 20, 英语 20, 常识 5): robots carry characters, pinyin, numbers or pictures, the top bar asks a question (read aloud, tap to hear again), and the right robot gives a rainbow bonus. A wrong one still falls asleep, with no penalty. Covers 认字, 拼音, 古诗 (10 textbook poems), 反义词/近义词/量词/组词/偏旁/形近字, counting and arithmetic up to 乘法口诀, English words/colours/numbers, and safety, nature, seasons and manners. See docs/curriculum.md (`node scripts/curriculum.mjs`).
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
