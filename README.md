# 小蓝坦克

A gentle tank game for kids, made for iPad. It installs from Safari: Share → 添加到主屏幕. No App Store, signing or account needed, and it works offline after the first visit.

- 100 levels in 10 worlds. Each world has its own story, number rule, fun fact and a big robot at level 10.
- Story: 乱码云 scrambled the robots' sleep chips. 小蓝 uses 晚安能量球 to help them nap, and they wake up as friends. In the end 乱码云 becomes a friend too.
- Light learning (optional bonus): robots carry numbers. Hitting them in order (count by 1/2/5/10/3, count down, compare sizes) gives a rainbow bonus. Story lines and numbers are read aloud.
- Parent settings (behind a multiplication question): daily level limit, daily minute limit (the child finishes the current level first), voice and sound, unlock all, reset.

## Develop

```
npm install
npx playwright install chromium webkit
npm run serve        # http://localhost:8765/
npm test             # unit tests + end-to-end tests (Chromium multi-touch + WebKit) at iPad size
npm run icons        # regenerate icons/
```

Plain HTML/CSS/JS, no build step. `src/story.js` holds the worlds and story, `src/levels.js` the seeded level generator, and `src/game.js` the game.
