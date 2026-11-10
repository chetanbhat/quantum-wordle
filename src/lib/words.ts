import { WORDS_1, WORDS_2 } from '../constants/wordlist'
import { VALID_GUESSES } from '../constants/validGuesses'

const dictionary = new Set([...WORDS_1, ...WORDS_2, ...VALID_GUESSES])
export const isWordInWordList = (word: string) =>
  dictionary.has(word.toLowerCase())

// Compatibility contract: elapsed 24-hour periods from the LOCAL epoch,
// including its original daylight-saving behavior. Never use calendar days here.
export const getWordsOfDay = (now = Date.now()) => {
  const epochMs = new Date('January 1, 2022 00:00:00').valueOf()
  const msInDay = 86400000
  const index = 3 + Math.floor((now - epochMs) / msInDay)
  const nextday =
    (Math.floor((now - epochMs) / msInDay) + 1) * msInDay + epochMs
  return {
    solution_A: WORDS_1[index % WORDS_1.length].toUpperCase(),
    solution_B: WORDS_2[index % WORDS_2.length].toUpperCase(),
    solutionIndex: index,
    tomorrow: nextday,
  }
}

export const { solution_A, solution_B, solutionIndex, tomorrow } =
  getWordsOfDay()
export const isWinningWord = (word: string) =>
  solution_A === word || solution_B === word
