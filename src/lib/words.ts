import { WORDS_1, WORDS_2 } from '../constants/wordlist'
import { VALID_GUESSES } from '../constants/validGuesses'

export const isWordInWordList = (word: string) => {
  return (
    WORDS_1.includes(word.toLowerCase()) ||
    WORDS_2.includes(word.toLowerCase()) ||
    VALID_GUESSES.includes(word.toLowerCase())
  )
}

export const isWinningWord = (word: string) => {
  return solution_A === word || solution_B === word;
}

export const getWordsOfDay = () => {
  // January 1, 2022 Game Epoch
  const epochMs = new Date('January 1, 2022 00:00:00').valueOf()
  const now = Date.now()
  const msInDay = 86400000
  const daysOffset = 1
  const index = daysOffset + Math.floor((now - epochMs) / msInDay)
  const nextday = (Math.floor((now - epochMs) / msInDay) + 1) * msInDay + epochMs

  return {
    solution_A: WORDS_1[index % WORDS_1.length].toUpperCase(),
    solution_B: WORDS_2[index % WORDS_2.length].toUpperCase(),
    solutionIndex: index,
    tomorrow: nextday,
  }
}

export const { solution_A, solution_B, solutionIndex, tomorrow } = getWordsOfDay()