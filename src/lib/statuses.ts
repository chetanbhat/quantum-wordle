// import { WORDS_1, WORDS_2 } from './words'

import { solution_A, solution_B } from "./words"

export type CharStatus = 'absent' | 'present' | 'correct' | 'q_present' | 'q_correct'

export const getStatuses = (
  guesses: string[]
): { [key: string]: CharStatus } => {
  const charObj: { [key: string]: CharStatus } = {}

  guesses.forEach((word) => {
    word.split('').forEach((letter, i) => {
      if (!solution_A.includes(letter) && !solution_B.includes(letter)) {
        // make status absent
        return (charObj[letter] = 'absent')
      }

      if (letter === solution_A[i] || letter === solution_B[i]) {
        //make status correct
        return (charObj[letter] = 'q_correct')
      }

      if (charObj[letter] !== 'correct') {
        //make status present
        return (charObj[letter] = 'q_present')
      }
    })
  })

  return charObj
}

export const getGuessStatuses = (guess: string): CharStatus[] => {
  const splitSolution_A = solution_A.split('')
  const splitSolution_B = solution_B.split('')
  const splitGuess = guess.split('')

  const solutionCharsTaken_A = splitSolution_A.map((_) => false)
  const solutionCharsTaken_B = splitSolution_B.map((_) => false)

  // Interference occurs when letters from the guess
  // are spread across the two solution
  const interference =
    splitGuess.some(g => splitSolution_A.includes(g)) &&
    splitGuess.some(g => splitSolution_B.includes(g))

  const statuses: CharStatus[] = Array.from(Array(guess.length))

  // handle all correct cases first
  splitGuess.forEach((letter, i) => {
    if (letter === splitSolution_A[i]) {
      statuses[i] = interference ? 'q_correct' : 'correct'
      solutionCharsTaken_A[i] = true
      return
    }
    if (letter === splitSolution_B[i]) {
      statuses[i] = interference ? 'q_correct' : 'correct'
      solutionCharsTaken_B[i] = true
      return
    }
  })

  splitGuess.forEach((letter, i) => {
    if (statuses[i]) return

    if (!splitSolution_A.includes(letter) && !splitSolution_B.includes(letter)) {
      // handles the absent case
      statuses[i] = 'absent'
      return
    }

    // now we are left with "present"s
    const indexOfPresentChar_A = splitSolution_A.findIndex(
      (x, index) => x === letter && !solutionCharsTaken_A[index]
    )
    // now we are left with "present"s
    const indexOfPresentChar_B = splitSolution_B.findIndex(
      (x, index) => x === letter && !solutionCharsTaken_B[index]
    )

    if (indexOfPresentChar_A > -1) {
      statuses[i] = interference ? 'q_present' : 'present'
      solutionCharsTaken_A[indexOfPresentChar_A] = true
      return
    }
    if (indexOfPresentChar_B > -1) {
      statuses[i] = interference ? 'q_present' : 'present'
      solutionCharsTaken_B[indexOfPresentChar_B] = true
      return
    } else {
      statuses[i] = 'absent'
      return
    }
  })

  return statuses
}
