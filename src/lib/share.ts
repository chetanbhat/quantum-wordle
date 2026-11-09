import { getGuessStatuses } from './statuses'
import { GAME_TITLE } from '../constants/strings'
import { getPreference, getStoredIsHighContrastMode } from './localStorage'
import { Puzzle, WordPair, getDailyPuzzle } from './puzzles'

export const generateEmojiGrid = (guesses: string[], pair?: WordPair) =>
  guesses
    .map((guess) => {
      const highContrast = getStoredIsHighContrastMode()
      return getGuessStatuses(guess, pair)
        .map((status) => {
          switch (status) {
            case 'correct':
              return highContrast ? '🟧' : '🟩'
            case 'q_correct':
              return highContrast ? '🟠' : '🟢'
            case 'present':
              return highContrast ? '🟦' : '🟨'
            case 'q_present':
              return highContrast ? '🔵' : '🟡'
            default:
              return getPreference('theme') === 'dark' ? '⬛' : '⬜'
          }
        })
        .join('')
    })
    .join('\n')

export function shareText(
  guesses: string[],
  lost: boolean,
  isHardMode: boolean,
  puzzle: Puzzle,
): string {
  const label =
    puzzle.mode === 'classic'
      ? `${puzzle.number}`
      : puzzle.mode === 'fresh'
        ? `Fresh ${puzzle.number}`
        : 'Practice'
  return `${GAME_TITLE} ${label} ${lost ? 'X' : guesses.length}/6${isHardMode ? '*' : ''}\n\n${generateEmojiGrid(guesses, puzzle)}`
}
export async function shareStatus(
  guesses: string[],
  lost: boolean,
  isHardMode: boolean,
  puzzle = getDailyPuzzle('classic'),
) {
  const text = shareText(guesses, lost, isHardMode, puzzle)
  if (navigator.canShare?.({ text }) && navigator.share)
    await navigator.share({ text })
  else await navigator.clipboard.writeText(text)
}
