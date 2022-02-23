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
        Welcome to the <b>Quantum version of Wordle</b>! Guess <b>any one of two</b> words in the <b>entangled-pair</b> in six tries. The two words in an entangled word pair never have overlapping letters.
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
        Example: If the hidden words were <b>MUSIC</b> and <b>WALTZ</b>, the guess (WEARY) is closest to <b>WALTZ</b>. Letter <b>W</b> is in the correct spot, and <b>A</b> is the wrong spot. Since the matched letters belong to the <b>same word</b> (WALTZ), you will see <b>completely filled tiles</b> for the whole guess.
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
        <b>Quantum case:</b> If your guess matches letters across both words in the entangled-pair, you will see half-filled colored tiles for the whole guess. Similar to the previous case, these tiles don't indicate which letters belong to which word in the pair. This is analogous to repeated measurements of multiple almost identical entangled-pairs producing mixed results (duality).
      </p>

      <div className="flex justify-center mb-1 mt-2">
        <Cell
          isRevealing={true}
          isCompleted={true}
          status="q_present" value="T" />
        <Cell
          isCompleted={true}
          status="q_correct" value="A" />
        <Cell
          value="X"
          isCompleted={true}
          status="absent"
        />
        <Cell value="E"
          isCompleted={true}
          status="absent" />
        <Cell
          isRevealing={true}
          isCompleted={true}
          status="q_present" value="S" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Example: If the hidden words were <b>MUSIC</b> and <b>WALTZ</b>, the guess (<b>TAXES</b>) has letters from both words. Letter <b>A</b> is in the correct spot, and <b>T</b> and <b>S</b> are in the wrong spots. Since the matched letters belong to <b>different words</b>, you will see <b>half-filled tiles</b> for the whole guess (indicating interference and ambiguity).</p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
        <b>Remember:</b> The two words in the entangled-word pairs <b>never share the same letters</b> between them (contain disjoint sets of letters). You only need to guess <b>any one of the two</b> words in the pair to win.
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
