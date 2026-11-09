import { GameStats } from './localStorage'
import { addStatsForCompletedGame, emptyStats } from './stats'
import {
  GameMode,
  Puzzle,
  WordPair,
  getDailyPuzzle,
  isFinished,
  isWon,
  newPracticePuzzle,
} from './puzzles'
import { isWordInWordList } from './words'

export const progressKey = (mode: GameMode) => `qwordle:v2:${mode}`
export const LEGACY_BACKUP_KEY = 'qwordle:backup:legacy:v1'
export const LOCK_NAME = 'qwordle:progress'
type LegacySource = { gameState: string | null; gameStats: string | null }
export type Progress = {
  version: 2
  puzzle: Puzzle
  guesses: string[]
  stats: GameStats
  bonus: { offered: boolean; guess: string | null; skipped: boolean }
  legacySource?: LegacySource
}
export type Snapshot = { progress: Progress; revision: string | null }

const message =
  'Saved data could not be read safely. Your existing data has been kept. Use Transfer / backup to export it.'
const conflict =
  'Your saved game changed in another tab. Reload to continue from the latest save.'
function requireValid(condition: unknown): asserts condition {
  if (!condition) throw new Error(message)
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const integer = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0
const word = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Z]{5}$/.test(value)

export function validateStats(value: unknown): asserts value is GameStats {
  requireValid(object(value))
  requireValid(
    Array.isArray(value.winDistribution) &&
      value.winDistribution.length === 6 &&
      value.winDistribution.every(integer),
  )
  requireValid(
    [
      'gamesFailed',
      'currentStreak',
      'bestStreak',
      'totalGames',
      'successRate',
    ].every((key) => integer(value[key])),
  )
  requireValid(
    (value.successRate as number) <= 100 &&
      (value.gamesFailed as number) <= (value.totalGames as number),
  )
  requireValid(
    (value.currentStreak as number) <= (value.bestStreak as number) &&
      (value.bestStreak as number) <= (value.totalGames as number),
  )
  requireValid(
    value.winDistribution.reduce((a: number, b: number) => a + b, 0) +
      (value.gamesFailed as number) ===
      value.totalGames,
  )
}
export function validateGame(
  value: unknown,
): asserts value is WordPair & { guesses: string[] } {
  requireValid(
    object(value) && word(value.solution_A) && word(value.solution_B),
  )
  requireValid(
    Array.isArray(value.guesses) &&
      value.guesses.length <= 6 &&
      value.guesses.every(word),
  )
  const firstWin = value.guesses.findIndex(
    (guess) => guess === value.solution_A || guess === value.solution_B,
  )
  requireValid(firstWin === -1 || firstWin === value.guesses.length - 1)
}
export function validateProgress(value: unknown): asserts value is Progress {
  requireValid(object(value) && value.version === 2 && object(value.puzzle))
  validateGame({ ...value.puzzle, guesses: value.guesses })
  validateStats(value.stats)
  requireValid(
    ['classic', 'fresh', 'practice'].includes(value.puzzle.mode as string),
  )
  requireValid(
    typeof value.puzzle.id === 'string' && integer(value.puzzle.number),
  )
  requireValid(
    value.puzzle.mode === 'practice' ||
      (typeof value.puzzle.tomorrow === 'number' &&
        Number.isFinite(value.puzzle.tomorrow)),
  )
  requireValid(
    object(value.bonus) &&
      typeof value.bonus.offered === 'boolean' &&
      typeof value.bonus.skipped === 'boolean',
  )
  requireValid(value.bonus.guess === null || word(value.bonus.guess))
  const won = isWon(value.guesses as string[], value.puzzle as WordPair)
  requireValid(!value.bonus.offered || won)
  requireValid(
    (!value.bonus.skipped && value.bonus.guess === null) || value.bonus.offered,
  )
  requireValid(!(value.bonus.skipped && value.bonus.guess !== null))
  if (value.legacySource !== undefined) {
    requireValid(object(value.legacySource))
    for (const key of ['gameState', 'gameStats'])
      requireValid(
        value.legacySource[key] === null ||
          typeof value.legacySource[key] === 'string',
      )
  }
  requireValid(
    value.puzzle.mode !== 'classic' || value.legacySource !== undefined,
  )
}
function parse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(message)
  }
}
function legacySource(): LegacySource {
  return {
    gameState: localStorage.getItem('gameState'),
    gameStats: localStorage.getItem('gameStats'),
  }
}
function emptyProgress(puzzle: Puzzle, stats = emptyStats()): Progress {
  return {
    version: 2,
    puzzle,
    guesses: [],
    stats,
    bonus: { offered: false, guess: null, skipped: false },
  }
}
export function readProgress(puzzle: Puzzle): Snapshot {
  const revision = localStorage.getItem(progressKey(puzzle.mode))
  if (revision !== null) {
    const saved = parse(revision)
    validateProgress(saved)
    requireValid(saved.puzzle.mode === puzzle.mode)
    if (
      puzzle.mode === 'classic' &&
      JSON.stringify(saved.legacySource) !== JSON.stringify(legacySource())
    ) {
      throw new Error(
        'An older game version changed your saved data. Export a backup before continuing; both saves have been kept.',
      )
    }
    if (saved.puzzle.id === puzzle.id) {
      requireValid(
        saved.puzzle.solution_A === puzzle.solution_A &&
          saved.puzzle.solution_B === puzzle.solution_B,
      )
      return { progress: saved, revision }
    }
    // Never let an old tab or a clock moving backwards replace a newer daily save.
    if (puzzle.mode !== 'practice' && saved.puzzle.number >= puzzle.number)
      throw new Error(conflict)
    return {
      progress: {
        ...emptyProgress(puzzle, saved.stats),
        legacySource: saved.legacySource,
      },
      revision,
    }
  }
  const progress = emptyProgress(puzzle)
  if (puzzle.mode === 'classic') {
    const source = legacySource()
    if (source.gameStats !== null) {
      const stats = parse(source.gameStats)
      validateStats(stats)
      progress.stats = stats
    }
    if (source.gameState !== null) {
      const game = parse(source.gameState)
      validateGame(game)
      if (
        game.solution_A === puzzle.solution_A &&
        game.solution_B === puzzle.solution_B
      )
        progress.guesses = [...game.guesses]
    }
    progress.legacySource = source
  }
  return { progress, revision }
}

export function getPracticePuzzle(): Puzzle {
  const raw = localStorage.getItem(progressKey('practice'))
  if (raw === null) return newPracticePuzzle()
  const saved = parse(raw)
  validateProgress(saved)
  requireValid(saved.puzzle.mode === 'practice')
  return saved.puzzle
}

// No unlocked fallback: without cross-tab serialization, a stale tab could
// replace a win or double-count it. Practice is available in memory instead.
export async function withProgressLock<T>(action: () => T): Promise<T> {
  if (!navigator.locks?.request)
    throw new Error(
      'This browser cannot safely save concurrent games. Use a current browser, or play practice without saving.',
    )
  return navigator.locks.request(LOCK_NAME, action)
}

function writeProgress(snapshot: Snapshot, next: Progress): Snapshot {
  validateProgress(next)
  const key = progressKey(next.puzzle.mode)
  if (localStorage.getItem(key) !== snapshot.revision) throw new Error(conflict)
  if (next.puzzle.mode === 'classic') {
    if (JSON.stringify(next.legacySource) !== JSON.stringify(legacySource()))
      throw new Error(conflict)
    if (localStorage.getItem(LEGACY_BACKUP_KEY) === null) {
      localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(next.legacySource))
    }
  }
  const revision = JSON.stringify(next)
  // setItem is atomic: failure leaves the previous complete record intact.
  localStorage.setItem(key, revision)
  return { progress: next, revision }
}

export type GameAction =
  | { type: 'guess'; word: string; offerBonus: boolean }
  | { type: 'bonus'; word: string }
  | { type: 'skip-bonus' }
export function advance(progress: Progress, action: GameAction): Progress {
  const next: Progress = {
    ...progress,
    guesses: [...progress.guesses],
    bonus: { ...progress.bonus },
  }
  const won = isWon(progress.guesses, progress.puzzle)
  if (action.type === 'guess') {
    if (isFinished(progress.guesses, progress.puzzle))
      throw new Error('This game is already complete.')
    if (!word(action.word) || !isWordInWordList(action.word))
      throw new Error('Word not found')
    next.guesses.push(action.word)
    if (isFinished(next.guesses, next.puzzle)) {
      const nowWon = isWon(next.guesses, next.puzzle)
      if (progress.puzzle.mode !== 'practice')
        next.stats = addStatsForCompletedGame(
          progress.stats,
          nowWon ? next.guesses.length - 1 : 6,
        )
      next.bonus.offered = nowWon && action.offerBonus
    }
  } else {
    if (
      !won ||
      !progress.bonus.offered ||
      progress.bonus.guess !== null ||
      progress.bonus.skipped
    )
      throw new Error('No bonus turn is available.')
    if (action.type === 'bonus') {
      if (!word(action.word) || !isWordInWordList(action.word))
        throw new Error('Word not found')
      if (progress.guesses.at(-1) === action.word)
        throw new Error('Guess the other word in the pair.')
      next.bonus.guess = action.word
    } else next.bonus.skipped = true
  }
  return next
}

export async function commitAction(
  snapshot: Snapshot,
  action: GameAction,
): Promise<Snapshot> {
  return withProgressLock(() => {
    const puzzle = snapshot.progress.puzzle
    if (
      puzzle.mode !== 'practice' &&
      getDailyPuzzle(puzzle.mode).id !== puzzle.id
    )
      throw new Error(
        'A new daily puzzle is available. Reload to start it; your saved progress is kept.',
      )
    const latest = readProgress(puzzle)
    if (
      latest.revision !== snapshot.revision ||
      JSON.stringify(latest.progress.legacySource) !==
        JSON.stringify(snapshot.progress.legacySource)
    )
      throw new Error(conflict)
    return writeProgress(snapshot, advance(latest.progress, action))
  })
}

export async function startPractice(snapshot: Snapshot): Promise<Snapshot> {
  return withProgressLock(() => {
    requireValid(snapshot.progress.puzzle.mode === 'practice')
    return writeProgress(
      snapshot,
      emptyProgress(newPracticePuzzle(snapshot.progress.puzzle)),
    )
  })
}
