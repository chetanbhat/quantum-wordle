import { getGuessStatuses } from '../../lib/statuses'
import { WordPair } from '../../lib/puzzles'
import { Cell } from './Cell'

type Props = {
  pair?: WordPair
  guess: string
  isRevealing?: boolean
}

export const CompletedRow = ({ guess, isRevealing, pair }: Props) => {
  const statuses = getGuessStatuses(guess, pair)

  return (
    <div className="flex justify-center mb-1">
      {guess.split('').map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isRevealing={isRevealing}
          isCompleted
        />
      ))}
    </div>
  )
}
