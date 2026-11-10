import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  advance,
  commitAction,
  getPracticePuzzle,
  LEGACY_BACKUP_KEY,
  progressKey,
  readProgress,
  startPractice,
  validateProgress,
} from '../src/lib/progress'
import {
  FRESH_EDITIONS,
  WORDLIST_CUTOVER_INDEX,
  getDailyPuzzle,
  newPracticePuzzle,
} from '../src/lib/puzzles'
import { emptyStats } from '../src/lib/stats'
import {
  collectBackup,
  decodeTransfer,
  encodeTransfer,
  importTransfer,
  previewTransfer,
} from '../src/lib/transfer'

const stats = {
  winDistribution: [1, 2, 3, 4, 5, 6],
  gamesFailed: 2,
  currentStreak: 7,
  bestStreak: 14,
  totalGames: 23,
  successRate: 91,
}
const clock = new Date('2026-11-09T12:00:00Z').valueOf()
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(clock)
})
const puzzle = () => getDailyPuzzle()
const guess = (word: string, offerBonus = false) => ({
  type: 'guess' as const,
  word,
  offerBonus,
})
function seedLegacy(guesses: string[] = []) {
  localStorage.setItem('gameStats', JSON.stringify(stats))
  localStorage.setItem(
    'gameState',
    JSON.stringify({
      solution_A: puzzle().solution_A,
      solution_B: puzzle().solution_B,
      guesses,
    }),
  )
  return collectBackup()
}
function assertLegacyUnchanged(before: Record<string, string | null>) {
  expect(localStorage.getItem('gameState')).toBe(before.gameState)
  expect(localStorage.getItem('gameStats')).toBe(before.gameStats)
}

it('reads legacy progress without any write, including completed wins', () => {
  const before = seedLegacy([puzzle().solution_A])
  const write = vi.spyOn(Storage.prototype, 'setItem')
  const snapshot = readProgress(puzzle())
  expect(snapshot.progress.stats).toEqual(stats)
  expect(snapshot.progress.guesses).toEqual([puzzle().solution_A])
  expect(write).not.toHaveBeenCalled()
  expect(collectBackup()).toEqual(before)
})
it('saves final guess and streak atomically, leaving original keys and an exact backup', async () => {
  const before = seedLegacy(['CRANE'])
  const initial = readProgress(puzzle())
  const saved = await commitAction(initial, guess(puzzle().solution_A, true))
  expect(saved.progress.stats).toEqual({
    ...stats,
    winDistribution: [1, 3, 3, 4, 5, 6],
    totalGames: 24,
    currentStreak: 8,
    successRate: 92,
  })
  expect(readProgress(puzzle())).toEqual(saved)
  expect(initial.progress.stats).toEqual(stats)
  assertLegacyUnchanged(before)
  expect(JSON.parse(localStorage.getItem(LEGACY_BACKUP_KEY)!)).toEqual({
    gameState: before.gameState,
    gameStats: before.gameStats,
  })
  await expect(commitAction(saved, guess(puzzle().solution_A))).rejects.toThrow(
    'already complete',
  )
})
it.each(['bonus', 'skip-bonus'] as const)(
  '%s never changes the daily win or statistics',
  async (type) => {
    const before = seedLegacy()
    const won = await commitAction(
      readProgress(puzzle()),
      guess(puzzle().solution_A, true),
    )
    const finished = await commitAction(
      won,
      type === 'bonus' ? { type, word: puzzle().solution_B } : { type },
    )
    expect(finished.progress.guesses).toEqual(won.progress.guesses)
    expect(finished.progress.stats).toEqual(won.progress.stats)
    assertLegacyUnchanged(before)
    await expect(
      commitAction(finished, { type: 'bonus', word: puzzle().solution_B }),
    ).rejects.toThrow('No bonus')
  },
)
it('a failed bonus retains the win, and replaying the first word does not consume the turn', async () => {
  seedLegacy()
  const won = await commitAction(
    readProgress(puzzle()),
    guess(puzzle().solution_A, true),
  )
  await expect(
    commitAction(won, { type: 'bonus', word: puzzle().solution_A }),
  ).rejects.toThrow('other word')
  const failed = await commitAction(won, { type: 'bonus', word: 'CRANE' })
  expect(failed.progress.stats).toEqual(won.progress.stats)
  expect(failed.progress.bonus.guess).toBe('CRANE')
})
it('counts a six-guess loss once and resets only the normal streak', async () => {
  seedLegacy()
  let saved = readProgress(puzzle())
  for (let i = 0; i < 6; i++)
    saved = await commitAction(saved, guess('CRANE', true))
  expect(saved.progress.stats.gamesFailed).toBe(3)
  expect(saved.progress.stats.currentStreak).toBe(0)
  expect(saved.progress.stats.totalGames).toBe(24)
  expect(saved.progress.bonus.offered).toBe(false)
  await expect(commitAction(saved, guess('CRANE'))).rejects.toThrow(
    'already complete',
  )
})
it('offers a bonus after a sixth-turn win', async () => {
  seedLegacy(['CRANE', 'CRANE', 'CRANE', 'CRANE', 'CRANE'])
  const saved = await commitAction(
    readProgress(puzzle()),
    guess(puzzle().solution_B, true),
  )
  expect(saved.progress.stats.winDistribution[5]).toBe(7)
  expect(saved.progress.bonus.offered).toBe(true)
})
it('serializes simultaneous tabs; only one completion is recorded', async () => {
  seedLegacy()
  const a = readProgress(puzzle()),
    b = readProgress(puzzle())
  const results = await Promise.allSettled([
    commitAction(a, guess(puzzle().solution_A)),
    commitAction(b, guess(puzzle().solution_B)),
  ])
  expect(results.map((result) => result.status).sort()).toEqual([
    'fulfilled',
    'rejected',
  ])
  expect(readProgress(puzzle()).progress.stats.totalGames).toBe(24)
})
it('refuses a stale tab with fewer guesses', async () => {
  seedLegacy()
  const a = readProgress(puzzle())
  await commitAction(a, guess('CRANE'))
  await expect(commitAction(a, guess(puzzle().solution_A))).rejects.toThrow(
    'another tab',
  )
  expect(readProgress(puzzle()).progress.stats).toEqual(stats)
})
it.each([LEGACY_BACKUP_KEY, progressKey('daily')])(
  'a failed write to %s preserves all original progress',
  async (failedKey) => {
    const before = seedLegacy(['CRANE'])
    const initial = readProgress(puzzle())
    const write = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === failedKey)
        throw new DOMException('Storage is full', 'QuotaExceededError')
      write.call(this, key, value)
    })
    await expect(
      commitAction(initial, guess(puzzle().solution_A)),
    ).rejects.toThrow('Storage is full')
    expect(readProgress(puzzle())).toEqual(initial)
    assertLegacyUnchanged(before)
  },
)
it('failed replacement preserves the previous atomic record byte for byte', async () => {
  seedLegacy()
  const previous = await commitAction(readProgress(puzzle()), guess('CRANE'))
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Full', 'QuotaExceededError')
  })
  await expect(
    commitAction(previous, guess(puzzle().solution_A)),
  ).rejects.toThrow()
  expect(localStorage.getItem(progressKey('daily'))).toBe(previous.revision)
})
it.each([
  '{',
  'null',
  '{}',
  '{"guesses":[]}',
  JSON.stringify({ ...stats, totalGames: -1 }),
])('preserves malformed legacy statistics %s', (raw) => {
  localStorage.setItem('gameStats', raw)
  expect(() => readProgress(puzzle())).toThrow()
  expect(localStorage.getItem('gameStats')).toBe(raw)
  expect(localStorage.getItem(progressKey('daily'))).toBeNull()
})
it('never falls back to zero stats for an invalid or future-version v2 save', () => {
  seedLegacy()
  for (const raw of ['{', '{"version":3}', 'null']) {
    localStorage.setItem(progressKey('daily'), raw)
    expect(() => readProgress(puzzle())).toThrow()
    expect(localStorage.getItem(progressKey('daily'))).toBe(raw)
  }
})
it('rejects older-client changes without merging or overwriting either save', async () => {
  seedLegacy()
  const saved = await commitAction(readProgress(puzzle()), guess('CRANE'))
  localStorage.setItem('gameStats', JSON.stringify(emptyStats()))
  await expect(commitAction(saved, guess(puzzle().solution_A))).rejects.toThrow(
    'older game version',
  )
  expect(localStorage.getItem(progressKey('daily'))).toBe(saved.revision)
})
it('does not replace a daily puzzle after rollover, and preserves streak on the next day', async () => {
  seedLegacy()
  const oldPuzzle = puzzle()
  const saved = await commitAction(readProgress(oldPuzzle), guess('CRANE'))
  vi.mocked(Date.now).mockReturnValue(clock + 86_400_000)
  await expect(
    commitAction(saved, guess(oldPuzzle.solution_A)),
  ).rejects.toThrow('new daily')
  const next = readProgress(puzzle())
  expect(next.progress.guesses).toEqual([])
  expect(next.progress.stats).toEqual(stats)
  await commitAction(next, guess(puzzle().solution_A))
  expect(() => readProgress(oldPuzzle)).toThrow('another tab')
})
it('moves existing players onto the fresh list at the cutover with statistics intact', async () => {
  const epoch = new Date('January 1, 2022 00:00:00').valueOf()
  const lastClassicDay = epoch + (WORDLIST_CUTOVER_INDEX - 4) * 86_400_000
  vi.mocked(Date.now).mockReturnValue(lastClassicDay)
  seedLegacy()
  const oldPuzzle = puzzle()
  const saved = await commitAction(readProgress(oldPuzzle), guess('CRANE'))
  expect(saved.progress.puzzle.number).toBe(WORDLIST_CUTOVER_INDEX - 1)
  vi.mocked(Date.now).mockReturnValue(lastClassicDay + 86_400_000)
  const next = readProgress(puzzle())
  expect(next.progress.puzzle.number).toBe(WORDLIST_CUTOVER_INDEX)
  expect(next.progress.guesses).toEqual([])
  expect(next.progress.stats).toEqual(stats)
  expect([
    next.progress.puzzle.solution_A,
    next.progress.puzzle.solution_B,
  ]).toEqual([
    FRESH_EDITIONS[0].pairs[0][0].toUpperCase(),
    FRESH_EDITIONS[0].pairs[0][1].toUpperCase(),
  ])
  await commitAction(next, guess('CRANE'))
  expect(() => readProgress(oldPuzzle)).toThrow('another tab')
})
it('rejects saved data writes without Web Locks and leaves originals intact', async () => {
  const before = seedLegacy()
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: undefined,
  })
  await expect(
    commitAction(readProgress(puzzle()), guess(puzzle().solution_A)),
  ).rejects.toThrow('cannot safely save')
  expect(collectBackup()).toEqual(before)
})
it('practice cannot alter any daily save or count daily statistics', async () => {
  const before = seedLegacy()
  const practice = newPracticePuzzle()
  let savedPractice = await commitAction(
    readProgress(practice),
    guess(practice.solution_A, true),
  )
  savedPractice = await commitAction(savedPractice, {
    type: 'bonus',
    word: practice.solution_B,
  })
  expect(savedPractice.progress.stats).toEqual(emptyStats())
  expect(getPracticePuzzle()).toEqual(practice)
  const next = await startPractice(savedPractice)
  expect(next.progress.puzzle.id).not.toBe(practice.id)
  expect([
    next.progress.puzzle.solution_A,
    next.progress.puzzle.solution_B,
  ]).not.toEqual([practice.solution_A, practice.solution_B])
  assertLegacyUnchanged(before)
  expect(localStorage.getItem(progressKey('daily'))).toBeNull()
})
it('rejects impossible saved bonus and post-win extra guesses', () => {
  const progress = readProgress(puzzle()).progress
  expect(() =>
    validateProgress({
      ...progress,
      bonus: { offered: true, guess: null, skipped: false },
    }),
  ).toThrow()
  expect(() =>
    validateProgress({ ...progress, guesses: [puzzle().solution_A, 'CRANE'] }),
  ).toThrow()
  expect(() =>
    advance(progress, { type: 'bonus', word: puzzle().solution_B }),
  ).toThrow()
})

describe('transfer safety', () => {
  it('round trips Unicode and URL-escaped base64 without modifying data', () => {
    const source = seedLegacy()
    source.theme = '日 + / ='
    const url = new URL('https://example.test/transfer')
    url.searchParams.set('data', encodeTransfer(source))
    expect(decodeTransfer(url.searchParams.get('data')!)).toEqual(source)
  })
  it('imports legacy progress into an empty browser, leaving legacy keys alone', async () => {
    const source = seedLegacy(['CRANE'])
    localStorage.clear()
    await importTransfer(source)
    const imported = readProgress(puzzle()).progress
    expect(imported.stats).toEqual(stats)
    expect(imported.guesses).toEqual(['CRANE'])
    expect(localStorage.getItem('gameStats')).toBeNull()
    expect(localStorage.getItem('gameState')).toBeNull()
  })
  it('imports the latest v2 stats and retains bonus progress', async () => {
    seedLegacy()
    const won = await commitAction(
      readProgress(puzzle()),
      guess(puzzle().solution_A, true),
    )
    const source = collectBackup()
    localStorage.clear()
    await importTransfer(source)
    expect(readProgress(puzzle()).progress.stats).toEqual(won.progress.stats)
    expect(readProgress(puzzle()).progress.bonus).toEqual(won.progress.bonus)
  })
  it('refuses to overwrite existing or malformed saves', async () => {
    const source = seedLegacy()
    const before = collectBackup()
    await expect(importTransfer(source)).rejects.toThrow('already has daily')
    expect(collectBackup()).toEqual(before)
    localStorage.clear()
    localStorage.setItem('gameStats', '{')
    await expect(importTransfer(source)).rejects.toThrow('already has daily')
    expect(localStorage.getItem('gameStats')).toBe('{')
  })
  it('rejects invalid transfers before performing any writes', async () => {
    const invalid = {
      gameStats: JSON.stringify({ ...stats, gamesFailed: '2' }),
      gameState: null,
    }
    const write = vi.spyOn(Storage.prototype, 'setItem')
    await expect(importTransfer(invalid)).rejects.toThrow()
    expect(write).not.toHaveBeenCalled()
    expect(() =>
      decodeTransfer(encodeTransfer({ unexpected: 'value' })),
    ).toThrow()
  })
  it('rejects conflicting saves from old and new versions', async () => {
    seedLegacy()
    await commitAction(readProgress(puzzle()), guess('CRANE'))
    localStorage.setItem('gameStats', JSON.stringify(emptyStats()))
    expect(() => previewTransfer(collectBackup())).toThrow('conflicting')
  })
  it('failed import leaves the destination empty and can be retried', async () => {
    const source = seedLegacy()
    localStorage.clear()
    const write = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === progressKey('daily'))
        throw new DOMException('Full', 'QuotaExceededError')
      write.call(this, key, value)
    })
    await expect(importTransfer(source)).rejects.toThrow('Full')
    expect(localStorage.getItem(progressKey('daily'))).toBeNull()
    vi.restoreAllMocks()
    await importTransfer(source)
    expect(readProgress(puzzle()).progress.stats).toEqual(stats)
  })
})

it('rejects a legacy save changed after initial load but before the first v2 commit', async () => {
  seedLegacy()
  const initial = readProgress(puzzle())
  localStorage.setItem(
    'gameState',
    JSON.stringify({ ...puzzle(), guesses: ['CRANE'] }),
  )
  await expect(
    commitAction(initial, guess(puzzle().solution_A)),
  ).rejects.toThrow('another tab')
  expect(localStorage.getItem(progressKey('daily'))).toBeNull()
})
