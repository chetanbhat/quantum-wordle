# Quantum Wordle (Qwordle)

This is a quantum twist on the popular word guessing game we all know and love.

## How to play

Guess one of two words in the ENTANGLED WORDLE PAIR (the QWORDLE) in six tries.

The words in an entagled word pair never have overlapping letters.

Each guess must be a valid five-letter word. Hit the enter button to submit.

After each guess, the color of the tiles will change to show how close your guess was to the Qwordle.

### Special Rules a.k.a **'Physicists, please don't kill me!'**:

Color of the tiles follow special rules based on quantum-wordle-mechanics . 

- **Classical case**: If your guess shares letters with exactly one of the two words in the pair (either one), you will see all solid colors (deterministic measurement).
- **Interference case**: If your guess shares letters with both words in the entangled-pair, you will see all striped colors (probabalistic measurement).
- Remember again that entangled-word pairs never share the same letters between them

Hint: The word-pairs may also be related to each by category or meaning

## [**Demo: Quantum Wordle**](https://qwordle.bhat.ca/)

Made using React, Typescript, and Tailwind.

## Thanks
Original code based on https://github.com/cwackerfuss/react-wordle

## Inspirations

- https://www.nytimes.com/games/wordle/index.html
- https://en.wikipedia.org/wiki/Quantum_tic-tac-toe

## Ideas & Feedback?

This project is still a work-in-progress. Although the current version is playable by itself, I want to evolve the rules (& implementation) to capture all 3 aspects the superposition, entaglement & collapse behaviors normally observed in quantum mechanics. That might make this project a useful teaching aid.

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
