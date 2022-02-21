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

## Build and run

### To Run Locally:

Clone the repository and perform the following command line actions:

```bash
$> cd quantum-wordle
$> npm install
$> npm run start
```

### To build/run docker container:

#### Development

```bash
$> docker build -t game:dev .
$> docker run -d -p 3000:3000 game:dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

#### Production

```bash
$> docker build --target=prod -t game:prod .
$> docker run -d -p 80:80 game:prod
```
