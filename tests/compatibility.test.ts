import { describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { getWordsOfDay, isWordInWordList } from '../src/lib/words'
import { getWordsOfDay as legacyWords } from './fixtures/legacy-words'
import { getGuessStatuses, getStatuses } from '../src/lib/statuses'
import {
  getGuessStatuses as legacyGuessStatuses,
  getStatuses as legacyStatuses,
} from './fixtures/legacy-statuses'
import { WORDS_1, WORDS_2 } from '../src/constants/wordlist'
import { VALID_GUESSES } from '../src/constants/validGuesses'
import {
  FRESH_EDITIONS,
  WORDLIST_CUTOVER_INDEX,
  getDailyPuzzle,
} from '../src/lib/puzzles'

it('preserves the classic word list byte for byte', () => {
  expect(
    createHash('sha256')
      .update(readFileSync('src/constants/wordlist.ts'))
      .digest('hex'),
  ).toBe('1e7b29575fc0d6e0a19698407fc0b77ab55e06c606ce25c7132eacf716f4f8b1')
})

it('matches the original scheduler throughout 2022–2042, including both sides of every boundary', () => {
  const epoch = new Date('January 1, 2022 00:00:00').valueOf()
  const now = vi.spyOn(Date, 'now')
  for (let day = 0; day < 365 * 20; day++) {
    for (const offset of [0, 1, 86_399_999]) {
      const time = epoch + day * 86_400_000 + offset
      now.mockReturnValue(time)
      expect(getWordsOfDay(time)).toEqual(legacyWords())
    }
  }
})

it('matches original tile and keyboard feedback for every accepted word', () => {
  for (const word of new Set([...WORDS_1, ...WORDS_2, ...VALID_GUESSES])) {
    const upper = word.toUpperCase()
    expect(getGuessStatuses(upper)).toEqual(legacyGuessStatuses(upper))
    expect(getStatuses([upper])).toEqual(legacyStatuses([upper]))
  }
  const sequence = ['APPLE', 'LEVEL', 'SHEEP', 'CHESS', 'PUPPY', 'ROBOT']
  expect(getStatuses(sequence)).toEqual(legacyStatuses(sequence))
})

it('retains duplicate-letter and interference rules for explicit pairs', () => {
  const pair = { solution_A: 'APPLE', solution_B: 'GHOST' }
  expect(getGuessStatuses('APPLE', pair)).toEqual([
    'correct',
    'correct',
    'correct',
    'correct',
    'correct',
  ])
  expect(getGuessStatuses('SHEEP', pair)).toEqual([
    'q_present',
    'q_correct',
    'q_present',
    'absent',
    'q_present',
  ])
  expect(
    getGuessStatuses('GEESE', { solution_A: 'GHOST', solution_B: '' }),
  ).toEqual(['correct', 'absent', 'absent', 'correct', 'absent'])
})

describe('fresh list editions', () => {
  it('contains 365 unique valid disjoint pairs, none from classic', () => {
    const classic = new Set(
      WORDS_1.map((word, i) => [word, WORDS_2[i]].sort().join(':')),
    )
    const seen = new Set<string>()
    for (const edition of FRESH_EDITIONS) {
      for (const [a, b] of edition.pairs) {
        expect(a).toMatch(/^[a-z]{5}$/)
        expect(b).toMatch(/^[a-z]{5}$/)
        expect(isWordInWordList(a) && isWordInWordList(b)).toBe(true)
        expect([...a].some((letter) => b.includes(letter))).toBe(false)
        const key = [a, b].sort().join(':')
        expect(classic.has(key) || seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
    expect(seen.size).toBe(365)
  })
})

describe('word-list cutover', () => {
  // Epoch-relative times yield the same puzzle index in every timezone, so
  // this boundary holds for players everywhere. See scripts/test-timezones.mjs.
  const atIndex = (index: number, offset = 3_600_000) =>
    new Date('January 1, 2022 00:00:00').valueOf() +
    (index - 3) * 86_400_000 +
    offset
  it('serves the original pairs until the cutover, then the fresh list', () => {
    for (const index of [
      WORDLIST_CUTOVER_INDEX - 30,
      WORDLIST_CUTOVER_INDEX - 1,
    ]) {
      const daily = getDailyPuzzle(atIndex(index))
      expect(daily.number).toBe(index)
      expect(daily.solution_A).toBe(getWordsOfDay(atIndex(index)).solution_A)
      expect(daily.solution_B).toBe(getWordsOfDay(atIndex(index)).solution_B)
    }
    const firstFresh = getDailyPuzzle(atIndex(WORDLIST_CUTOVER_INDEX))
    expect(firstFresh.number).toBe(WORDLIST_CUTOVER_INDEX)
    expect([firstFresh.solution_A, firstFresh.solution_B]).toEqual([
      FRESH_EDITIONS[0].pairs[0][0].toUpperCase(),
      FRESH_EDITIONS[0].pairs[0][1].toUpperCase(),
    ])
    expect(firstFresh.id).not.toBe(
      getDailyPuzzle(atIndex(WORDLIST_CUTOVER_INDEX - 1)).id,
    )
    expect(getDailyPuzzle(atIndex(WORDLIST_CUTOVER_INDEX, 80_000_000))).toEqual(
      firstFresh,
    )
    expect(getDailyPuzzle(atIndex(WORDLIST_CUTOVER_INDEX + 1)).id).not.toBe(
      firstFresh.id,
    )
  })
})

it('keeps the first fresh edition immutable', () => {
  expect(
    createHash('sha256')
      .update(JSON.stringify(FRESH_EDITIONS[0].pairs))
      .digest('hex'),
  ).toBe('5657f9979b7cb612d25b3e45a605c6fde07019a1a746c2edd344c010cc9dd51d')
})
