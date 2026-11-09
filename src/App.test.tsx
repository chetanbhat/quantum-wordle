import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import App from './App'
import { AlertProvider } from './context/AlertContext'
import { getDailyPuzzle } from './lib/puzzles'
import { progressKey } from './lib/progress'
import { emptyStats } from './lib/stats'
import { TransferPage } from './components/transfer/TransferPage'
import { encodeTransfer } from './lib/transfer'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  vi.spyOn(Date, 'now').mockReturnValue(
    new Date('2026-11-09T12:00:00Z').valueOf(),
  )
})
const renderGame = () =>
  render(
    <AlertProvider>
      <App />
    </AlertProvider>,
  )
async function typeWord(word: string) {
  for (const key of word)
    fireEvent.keyDown(document.body, { key, code: `Key${key}` })
  await act(async () => {
    fireEvent.keyDown(document.body, { key: 'Enter', code: 'Enter' })
  })
}

it('mounting, switching modes, and opening dialogs do not write game data', async () => {
  const write = vi.spyOn(Storage.prototype, 'setItem')
  renderGame()
  fireEvent.click(screen.getByRole('button', { name: 'Fresh daily' }))
  fireEvent.click(screen.getByRole('button', { name: 'Practice' }))
  fireEvent.click(screen.getByRole('button', { name: 'Classic' }))
  fireEvent.click(screen.getByRole('button', { name: 'How to play' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await typeWord(getDailyPuzzle('classic').solution_A)
  expect(write).not.toHaveBeenCalled()
})
it('wins once, hides the other word for a bonus, and retains the classic result after a failed bonus', async () => {
  const puzzle = getDailyPuzzle('classic')
  renderGame()
  fireEvent.click(screen.getByRole('checkbox'))
  await typeWord(puzzle.solution_A)
  await screen.findByRole('region', { name: 'Bonus turn' })
  expect(
    screen.queryByText(new RegExp(`The words were`)),
  ).not.toBeInTheDocument()
  const before = JSON.parse(localStorage.getItem(progressKey('classic'))!)
  expect(before.stats.totalGames).toBe(1)
  await typeWord('CRANE')
  await screen.findByText(
    'Bonus turn complete. Your original win still counts.',
  )
  const after = JSON.parse(localStorage.getItem(progressKey('classic'))!)
  expect(after.stats).toEqual(before.stats)
  expect(after.guesses).toEqual(before.guesses)
})
it('shows unreadable stats without replacing them, while still allowing practice', () => {
  localStorage.setItem('gameStats', '{broken')
  renderGame()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'existing data has been kept',
  )
  expect(localStorage.getItem('gameStats')).toBe('{broken')
  fireEvent.click(screen.getByRole('button', { name: 'Practice' }))
  expect(
    screen.getByRole('button', { name: 'New practice puzzle' }),
  ).toBeInTheDocument()
})
it('reloads legacy completed games without changing streaks', async () => {
  const puzzle = getDailyPuzzle('classic')
  localStorage.setItem(
    'gameStats',
    JSON.stringify({
      ...emptyStats(),
      winDistribution: [1, 0, 0, 0, 0, 0],
      currentStreak: 1,
      bestStreak: 1,
      totalGames: 1,
      successRate: 100,
    }),
  )
  localStorage.setItem(
    'gameState',
    JSON.stringify({ ...puzzle, guesses: [puzzle.solution_A] }),
  )
  renderGame()
  expect(screen.getByText('Solved in 1/6!')).toBeInTheDocument()
  await typeWord(puzzle.solution_B)
  expect(localStorage.getItem(progressKey('classic'))).toBeNull()
})
it('does not apply a transfer simply by opening its URL', async () => {
  const source = { gameStats: JSON.stringify(emptyStats()), gameState: null }
  window.history.replaceState(
    null,
    '',
    `/transfer?data=${encodeURIComponent(encodeTransfer(source))}`,
  )
  const write = vi.spyOn(Storage.prototype, 'setItem')
  render(<TransferPage />)
  expect(
    screen.getByRole('button', { name: 'Import classic progress' }),
  ).toBeInTheDocument()
  expect(write).not.toHaveBeenCalled()
  expect(window.location.search).toBe('')
  fireEvent.click(
    screen.getByRole('button', { name: 'Import classic progress' }),
  )
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'imported successfully',
    ),
  )
})
