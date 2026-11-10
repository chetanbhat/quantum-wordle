import freshPairs from '../constants/freshPairs.json'
import { getWordsOfDay } from './words'

export type GameMode = 'daily' | 'practice'
export type WordPair = { solution_A: string; solution_B: string }
export type Puzzle = WordPair & {
  id: string
  mode: GameMode
  number: number
  tomorrow?: number
}

// First puzzle number served from the fresh word list. This is a fixed
// puzzle number, not a calendar date: every timezone flips at its own local
// day boundary, exactly like the daily rollover. Chosen 2026-11-10 so all
// timezones get at least 14 days on the original list (2026-11-24 UTC).
export const WORDLIST_CUTOVER_INDEX = 1791

// Published editions are immutable. Add future editions at a future puzzle
// number; never edit, reorder, or remove an edition that has already been used.
export const FRESH_EDITIONS = [
  { id: 'fresh-2026-01', startsAt: WORDLIST_CUTOVER_INDEX, pairs: freshPairs },
] as const

// The single daily puzzle. Before the cutover it is the original pair for
// the day; from the cutover on, the current fresh edition supplies the pair.
// Statistics and streaks continue in the same record across the cutover.
export function getDailyPuzzle(now = Date.now()): Puzzle {
  const classic = getWordsOfDay(now)
  if (classic.solutionIndex < WORDLIST_CUTOVER_INDEX) {
    return {
      ...classic,
      mode: 'daily',
      number: classic.solutionIndex,
      id: `daily:${classic.solutionIndex}`,
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
    mode: 'daily',
    id: `daily:${classic.solutionIndex}`,
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
