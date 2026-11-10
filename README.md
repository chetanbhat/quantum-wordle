# Quantum Wordle (Qwordle)

This is an attempt to put a quantum twist on the popular word guessing game we all know and love.

## How to play

Guess one of two words in the ENTANGLED WORDLE PAIR (the QWORDLE) in six tries.

The words in an entangled word pair never have overlapping letters.

Each guess must be a valid five-letter word. Hit the enter button to submit.

After each guess, the color of the tiles will change to show how close your guess was to the Qwordle.

### **Special Rules** a.k.a **'Physicists, please don't kill me!'**:

Color of the tiles follow special rules based on quantum-wordle-mechanics.

- **Classical case**: If your guess shares letters with exactly one of the two words in the entangled-pair (either one), you will see all solid colors. This is analogous to a deterministic measurement of the closest word in the pair. There is no indicator for which of the two words matched.
- **Interference case**: If your guess shares letters with both words in the entangled-pair, all matching tiles change to partially colored. Just like before, these tiles don't show which letters belong to which word in the pair. However, the partially coloring of tiles indicate that not all of the letters from the guess belong to the same word. This is analogous to a repeated measurement of [almost identical](https://en.wikipedia.org/wiki/No-cloning_theorem) entangled-pairs producing mixed results.
- **Remember**: The words of the entangled-word pairs never share the same letters between them
- **TODO**: The words of the entangled-word pairs can be related to each other by category or meaning to make this more fun!

## [**Demo: Quantum Wordle**](https://qwordle.bhat.ca/)

## Thanks

Original code based on https://github.com/cwackerfuss/react-wordle

## Inspirations

- https://www.nytimes.com/games/wordle/index.html
- https://en.wikipedia.org/wiki/Quantum_tic-tac-toe

## Ideas & Feedback?

This project is still a work-in-progress. Although the current version is playable by itself, I want to evolve the rules (& implementation) to capture all 3 aspects - the superposition, entaglement & collapse behaviors normally observed in quantum mechanics. That might make this project a useful teaching aid.

## Game modes

There is one daily puzzle. It serves the original daily pairs until the word-list cutover (puzzle 1791, 2026-11-24), then moves automatically onto a refreshed 365-pair collection; streaks and statistics carry over. Enable the optional bonus turn before winning to try the other word with one extra guess; the first win remains final. Practice supports unlimited puzzles without changing daily streaks.

## Development

Use Node.js 22.12 or later and npm:

```sh
npm ci
npm start
```

The development server runs at http://localhost:3000. The app uses React 19, TypeScript, Vite, and Tailwind. `npm run build` typechecks the project and creates the static `build/` directory. `npm run preview` serves that build locally.

## Validation and releases

```sh
npx playwright install --with-deps chromium firefox webkit
npm run check
npm audit --audit-level=low
```

The suite covers classic schedule compatibility, the word-list cutover, saved-data safety, practice isolation, transfers, and Chromium/Firefox/WebKit/mobile browser flows. Read [the compatibility and release notes](docs/compatibility.md) before changing puzzle selection, storage, or published word lists. They also describe fresh-list editions and the required rollback compatibility.

Work on feature branches and review the tested preview before production. Netlify continues to publish `build/`; no production deployment is triggered by a local build.

## Docker

```sh
docker build --target=dev -t qwordle:dev .
docker run --rm -p 3000:3000 qwordle:dev

docker build --target=prod -t qwordle:prod .
docker run --rm -p 8080:80 qwordle:prod
```

The production image serves both the game and `/transfer` through Nginx. Game data stays in the player's browser. Use the in-game **Transfer / backup** link to export progress before moving devices.
