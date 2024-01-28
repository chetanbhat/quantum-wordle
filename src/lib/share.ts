import { getGuessStatuses } from './statuses'
import { solutionIndex } from './words'
import { GAME_TITLE } from '../constants/strings'
import { getStoredIsHighContrastMode } from './localStorage'
import { MAX_CHALLENGES } from '../constants/settings'

export const shareStatus = (
  guesses: string[],
  lost: boolean,
  isHardMode: boolean
) => {
  const textToShare = `${GAME_TITLE} ${solutionIndex} ${lost ? 'X' : guesses.length
    }/${MAX_CHALLENGES}${isHardMode ? '*' : ''}\n\n` +
    generateEmojiGrid(guesses);


  if (navigator.canShare && navigator.share) {
    const shareData = { text: textToShare };
    if (navigator.canShare(shareData))
        navigator.share(shareData);
  } 
  else {
    navigator.clipboard.writeText(textToShare);
  }
}

export const generateEmojiGrid = (guesses: string[]) => {
  return guesses
    .map((guess) => {
      const status = getGuessStatuses(guess)
      const isHighContrast = getStoredIsHighContrastMode()
      return guess
        .split('')
        .map((_, i) => {
          switch (status[i]) {
            case 'correct':
              if (isHighContrast) {
                return '🟧'
              }
              return '🟩'
            case 'q_correct':
              if (isHighContrast) {
                return '🟠'
              }
              return '🟢'
            case 'present':
              if (isHighContrast) {
                return '🟦'
              }
              return '🟨'
            case 'q_present':
              if (isHighContrast) {
                return '🔵'
              }
              return '🟡'
            default:
              if (localStorage.getItem('theme') === 'dark') {
                return '⬛'
              }
              return '⬜'
          }
        })
        .join('')
    })
    .join('\n')
}
