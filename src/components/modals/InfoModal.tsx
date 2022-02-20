import { Cell } from '../grid/Cell'
import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const InfoModal = ({ isOpen, handleClose }: Props) => {
  return (
    <BaseModal title="How to play Qwordle" isOpen={isOpen} handleClose={handleClose}>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Welcome to the <b>Quantum version of Wordle</b>! Guess one of two words in the <b>entangled-pair</b> in six tries. The two words in an entagled word pair never have overlapping letters.
      </p>
      <h4 className="mt-2 text-lg text-gray-500 dark:text-gray-300">
        <b>Special Rules</b>
      </h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
        The colored tiles follow special rules loosely inspired by quantum mechanics:
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
        <b>Classical case:</b> If your guess matches letters with exactly one of the two words in the entangled-pair (either one), you will see completely-filled colored tiles. However, there is no indicator for which of the two words in the pair matches your current guess. This is analogous to a deterministic measurement of the closest word in the pair.
      </p>
      <div className="flex justify-center mb-1 mt-2">
        <Cell
          isRevealing={true}
          isCompleted={true}
          value="W"
          status="correct"
        />
        <Cell value="E"
          isCompleted={true}
          status="absent" />
        <Cell value="A"
          isRevealing={true}
          isCompleted={true}
          status="present" />
        <Cell value="R"
          isCompleted={true}
          status="absent" />
        <Cell value="Y"
          isCompleted={true}
          status="absent" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        The letters W and A are in the same word. W is in the correct spot, and A is the wrong spot.
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
        <b>Quantum case:</b> If your guess matches letters across both words in the entangled-pair, you will see half-filled colored tiles for the whole guess. Similar to the previous case, these tiles don't indicate which letters belong to which word in the pair. This is analogous to repeated measurements of <i>multiple almost identical</i> entangled-pairs producing mixed results (duality).
      </p>

      <div className="flex justify-center mb-1 mt-2">
        <Cell
          isRevealing={true}
          isCompleted={true}
          status="q_correct" value="B" />
        <Cell
          isRevealing={true}
          isCompleted={true}
          status="q_present" value="O" />
        <Cell
          value="N"
          isCompleted={true}
          status="absent"
        />
        <Cell value="E"
          isCompleted={true}
          status="absent" />
        <Cell
          isRevealing={true}
          isCompleted={true}
          status="q_correct" value="S" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Letters B, O, and S are spread across different words in the entangled-pair.</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
        <b>Remember:</b> The two words in the entangled-word pairs never share the same letters between them (contain disjoint sets of letters).
      </p>

      <p className="mt-3 italic text-sm text-gray-500 dark:text-gray-300">
        This is an attempt to put a quantum twist on the popular word guessing game we all know and love. -{' '}
        <a
          href="https://github.com/chetanbhat/quantum-wordle"
          className="underline font-bold" target="_blank" rel="noreferrer"
        >
          check out the source code here
        </a>{' '}
      </p>
      <p className="mt-3 italic text-sm text-gray-500 dark:text-gray-300">
        - built by <a
          href="https://bhat.ca/" target="_blank" rel="noreferrer"
          className="underline font-bold"
        >
          Chetan Bhat
        </a>{' '}
      </p>
    </BaseModal >
  )
}
