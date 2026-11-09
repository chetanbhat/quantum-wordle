import { WordPair } from '../../lib/puzzles'
import { getStatuses } from '../../lib/statuses'
import { Key } from './Key'
import { useEffect } from 'react'
import { ENTER_TEXT, DELETE_TEXT } from '../../constants/strings'

type Props = {
  onChar: (value: string) => void
  onDelete: () => void
  onEnter: () => void
  pair?: WordPair
  disabled?: boolean
  guesses: string[]
  isRevealing?: boolean
}

export const Keyboard = ({
  pair,
  disabled,
  onChar,
  onDelete,
  onEnter,
  guesses,
  isRevealing,
}: Props) => {
  const charStatuses = getStatuses(guesses, pair)

  const onClick = (value: string) => {
    if (disabled) return
    if (value === 'ENTER') {
      onEnter()
    } else if (value === 'DELETE') {
      onDelete()
    } else {
      onChar(value)
    }
  }

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (disabled || e.ctrlKey || e.metaKey || e.altKey || e.isComposing)
        return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (
        target?.closest(
          'input:not([type="checkbox"]), textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return
      if (e.code === 'Enter' && target?.closest('button, input, a')) return
      if (e.code === 'Enter' || e.code === 'Backspace') e.preventDefault()
      if (e.code === 'Enter') {
        onEnter()
      } else if (e.code === 'Backspace') {
        onDelete()
      } else {
        const key = e.key.toUpperCase()
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
          target?.blur()
          onChar(key)
        }
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [onEnter, onDelete, onChar, disabled])

  return (
    <div>
      <div className="flex justify-center mb-1">
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
      </div>
      <div className="flex justify-center mb-1">
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <Key width={65.4} value="ENTER" onClick={onClick}>
          {ENTER_TEXT}
        </Key>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
          />
        ))}
        <Key width={65.4} value="DELETE" onClick={onClick}>
          {DELETE_TEXT}
        </Key>
      </div>
    </div>
  )
}
