import { expect, it, vi } from 'vitest'
import { generateEmojiGrid, shareStatus, shareText } from '../src/lib/share'
import { getDailyPuzzle, newPracticePuzzle } from '../src/lib/puzzles'

it('retains the daily share format and separates practice results', () => {
  const puzzle = getDailyPuzzle()
  expect(shareText([puzzle.solution_A], false, false, puzzle)).toBe(
    `Qwordle ${puzzle.number} 1/6\n\n🟩🟩🟩🟩🟩`,
  )
  expect(shareText(['CRANE'], true, true, puzzle)).toMatch(
    /^Qwordle \d+ X\/6\*/,
  )
  const practice = newPracticePuzzle()
  expect(shareText([practice.solution_A], false, false, practice)).toContain(
    'Practice 1/6',
  )
})
it('supports high contrast and dark-mode emoji without affecting storage', () => {
  localStorage.setItem('highContrast', '1')
  localStorage.setItem('theme', 'dark')
  expect(
    generateEmojiGrid(['APPLE'], { solution_A: 'APPLE', solution_B: 'GHOST' }),
  ).toBe('🟧🟧🟧🟧🟧')
  expect(
    generateEmojiGrid(['ZZZZZ'], { solution_A: 'APPLE', solution_B: 'GHOST' }),
  ).toBe('⬛⬛⬛⬛⬛')
})
it('falls back to clipboard when native sharing cannot share text', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: () => false,
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  await shareStatus(['CRANE'], false, false)
  expect(writeText).toHaveBeenCalledOnce()
})
it('propagates clipboard failure rather than reporting success', async () => {
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: () => false,
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: () => Promise.reject(new Error('Clipboard unavailable')),
    },
  })
  await expect(shareStatus(['CRANE'], false, false)).rejects.toThrow(
    'Clipboard unavailable',
  )
})
