# Fox Fields 🦊

A cosy, ad-free logic puzzle in the style of "Queens" / star-battle games.
Place one fox in every row, every column and every coloured field, and never
let two foxes touch (not even diagonally). Every level has exactly one answer.

Built with **React Native + Expo (TypeScript)** so a single codebase ships to
Android, iOS and the web.

## Features

- Endless, deterministic levels (level 12 is the same puzzle on every device)
- Grid sizes ramp from 5×5 up to 10×10
- Every puzzle is verified to have a unique solution and, for most levels, to
  be solvable by pure deduction (no guessing)
- Tap to mark ✕ / place a fox, long-press to place a fox directly
- Undo, unlimited free hints, clear, timer and best-time tracking
- Optional auto-mark (placing a fox marks every cell it rules out)
- Haptics on device, no ads, no lives, no in-app purchases

## Project layout

```
App.tsx                 app shell + screen switching
src/logic/puzzle.ts     generator, solvers, board evaluation (pure TS)
src/logic/levels.ts     level → grid size / difficulty / seed
src/logic/rng.ts        seeded PRNG
src/logic/__tests__/    Jest tests for the logic layer
src/components/         Board, Cell, small UI primitives
src/screens/            Home, Game, Settings
src/storage.ts          progress + settings persistence (AsyncStorage)
src/theme.ts            colours and sizes
```

## Running it

```bash
npm install
npm start          # Expo dev server; scan the QR with Expo Go on your phone
npm run android    # or open on a connected Android device / emulator
npm run ios        # needs macOS + Xcode
npm run web        # runs in the browser
```

Tests and typecheck:

```bash
npm test
npm run typecheck
```

## Web hosting on Netlify

`netlify.toml` builds the web version (`npx expo export --platform web`) and
publishes `dist/` with SPA redirects and long-lived caching for hashed bundles.
Link the repository to the Netlify project and every push deploys.

## Building store binaries

The app is Expo managed, so builds go through
[EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform android   # .aab / .apk
eas build --platform ios       # needs an Apple developer account
```

Bundle identifiers are set in `app.json` (`com.foxfields.app`); change them
before publishing.

## How puzzles are made

1. Pick a random valid fox placement (one per row/column, none touching).
2. Grow one region around each fox with randomised, lopsided flood fill.
3. Enumerate solutions with a backtracking solver; while more than one
   exists, move a cell from an alternate solution into a neighbouring region
   (keeping every region connected) until only the intended answer remains.
4. Rate the result with a deduction-only solver (singles, row/column
   confinement, naked pairs). Early levels require a deduction-only solve.
