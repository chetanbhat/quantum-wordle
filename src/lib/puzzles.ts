import freshPairs from '../constants/freshPairs.json'
import { getWordsOfDay } from './words'

export type GameMode = 'classic' | 'fresh' | 'practice'
export type WordPair = { solution_A: string; solution_B: string }
export type Puzzle = WordPair & {
  id: string
  mode: GameMode
  number: number
  tomorrow?: number
}

// Published editions are immutable. Add future editions at a future puzzle
// number; never edit, reorder, or remove an edition that has already been used.
export const FRESH_EDITIONS = [
  { id: 'fresh-2026-01', startsAt: 0, pairs: freshPairs },
] as const

export function getDailyPuzzle(
  mode: 'classic' | 'fresh',
  now = Date.now(),
): Puzzle {
  const classic = getWordsOfDay(now)
  if (mode === 'classic') {
    return {
      ...classic,
      mode,
      number: classic.solutionIndex,
      id: `classic:${classic.solutionIndex}`,
    }
  }
  const edition = [...FRESH_EDITIONS]
    .reverse()
    .find((pack) => pack.startsAt <= classic.solutionIndex)!
  const pair =
    edition.pairs[
      (classic.solutionIndex - edition.startsAt) % edition.pairs.length
    ]
  return {
    mode,
    id: `${edition.id}:${classic.solutionIndex}`,
    number: classic.solutionIndex,
    solution_A: pair[0].toUpperCase(),
    solution_B: pair[1].toUpperCase(),
    tomorrow: classic.tomorrow,
  }
}

export function newPracticePuzzle(previous?: WordPair): Puzzle {
  const pairs = freshPairs.filter(
    ([a, b]) =>
      a.toUpperCase() !== previous?.solution_A ||
      b.toUpperCase() !== previous?.solution_B,
  )
  const random = crypto.getRandomValues(new Uint32Array(1))[0]
  const pair = pairs[random % pairs.length]
  return {
    id: `practice:${crypto.randomUUID()}`,
    mode: 'practice',
    number: 0,
    solution_A: pair[0].toUpperCase(),
    solution_B: pair[1].toUpperCase(),
  }
}

export const isWon = (guesses: string[], pair: WordPair) =>
  guesses.some((word) => word === pair.solution_A || word === pair.solution_B)
export const isFinished = (guesses: string[], pair: WordPair) =>
  isWon(guesses, pair) || guesses.length === 6
