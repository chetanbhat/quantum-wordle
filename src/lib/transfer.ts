import { GameStats } from './localStorage'
import { getDailyPuzzle } from './puzzles'
import { emptyStats } from './stats'
import {
  LEGACY_BACKUP_KEY,
  Progress,
  progressKey,
  validateGame,
  validateProgress,
  validateStats,
  withProgressLock,
} from './progress'

export const BACKUP_KEYS = [
  'gameState',
  'gameStats',
  'highContrast',
  'theme',
  'gameMode',
  'qwordle:bonus-enabled',
  progressKey('daily'),
  progressKey('practice'),
  // Unshipped branch builds used these keys. They are never imported, but
  // recognizing them keeps their backups decodable for safekeeping.
  'qwordle:v2:classic',
  'qwordle:v2:fresh',
  LEGACY_BACKUP_KEY,
  'qwordle:backup:transfer:v1',
]
export function collectBackup(): Record<string, string | null> {
  return Object.fromEntries(
    BACKUP_KEYS.map((key) => [key, localStorage.getItem(key)]),
  )
}
export function encodeTransfer(data: Record<string, string | null>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
}
export function decodeTransfer(encoded: string): Record<string, string | null> {
  if (encoded.length > 200_000) throw new Error('This transfer is too large.')
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0))
  const data: unknown = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(bytes),
  )
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Invalid transfer data.')
  for (const [key, value] of Object.entries(data)) {
    if (
      !BACKUP_KEYS.includes(key) ||
      (value !== null && typeof value !== 'string')
    )
      throw new Error('Unsupported transfer data.')
  }
  return data as Record<string, string | null>
}

export function previewTransfer(data: Record<string, string | null>): Progress {
  const current = data[progressKey('daily')]
  if (current != null) {
    const saved: unknown = JSON.parse(current)
    validateProgress(saved)
    if (saved.puzzle.mode !== 'daily') throw new Error('Invalid daily save.')
    if (
      saved.legacySource?.gameState !== (data.gameState ?? null) ||
      saved.legacySource?.gameStats !== (data.gameStats ?? null)
    )
      throw new Error(
        'This backup contains conflicting game versions. Keep the backup; no data has been imported.',
      )
    return { ...saved, legacySource: { gameState: null, gameStats: null } }
  }
  let stats: GameStats = emptyStats()
  if (data.gameStats != null) {
    const parsed: unknown = JSON.parse(data.gameStats)
    validateStats(parsed)
    stats = parsed
  }
  const puzzle = getDailyPuzzle()
  let guesses: string[] = []
  if (data.gameState != null) {
    const game: unknown = JSON.parse(data.gameState)
    validateGame(game)
    if (
      game.solution_A === puzzle.solution_A &&
      game.solution_B === puzzle.solution_B
    )
      guesses = game.guesses
  }
  if (data.gameStats == null && data.gameState == null)
    throw new Error('No daily game data was found.')
  return {
    version: 2,
    puzzle,
    guesses,
    stats,
    bonus: { offered: false, guess: null, skipped: false },
    legacySource: { gameState: null, gameStats: null },
  }
}

export async function importTransfer(
  data: Record<string, string | null>,
): Promise<void> {
  await withProgressLock(() => {
    // A transfer never overwrites or clears any existing daily save, even if
    // it looks older or has fewer games. Merging streaks is ambiguous.
    if (
      ['gameState', 'gameStats', progressKey('daily')].some(
        (key) => localStorage.getItem(key) !== null,
      )
    )
      throw new Error(
        'This browser already has daily progress. Nothing was replaced. Use a browser profile with no daily save.',
      )
    const progress = previewTransfer(data)
    validateProgress(progress)
    const backupKey = 'qwordle:backup:transfer:v1'
    if (localStorage.getItem(backupKey) === null)
      localStorage.setItem(backupKey, JSON.stringify(data))
    localStorage.setItem(progressKey('daily'), JSON.stringify(progress))
  })
}
