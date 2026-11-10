import { useEffect, useRef, useState } from 'react'
import {
  InformationCircleIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/outline'
import { Grid } from './components/grid/Grid'
import { CurrentRow } from './components/grid/CurrentRow'
import { CompletedRow } from './components/grid/CompletedRow'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal } from './components/modals/InfoModal'
import { StatsModal } from './components/modals/StatsModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { AlertContainer } from './components/alerts/AlertContainer'
import { useAlert } from './context/AlertContext'
import { GAME_TITLE } from './constants/strings'
import {
  getPreference,
  setPreference,
  getStoredIsHighContrastMode,
  setStoredIsHighContrastMode,
} from './lib/localStorage'
import {
  GameMode,
  getDailyPuzzle,
  isWon,
  isFinished,
  newPracticePuzzle,
} from './lib/puzzles'
import {
  Snapshot,
  advance,
  commitAction,
  getPracticePuzzle,
  readProgress,
  startPractice,
} from './lib/progress'
import { emptyStats } from './lib/stats'
import { isWordInWordList } from './lib/words'
import './App.css'

const button =
  'rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm disabled:opacity-50'
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Your game could not be saved. Existing data has been kept. Please reload before trying again.'

function initialGame(mode: GameMode): {
  snapshot: Snapshot | null
  error: string
  memory: boolean
} {
  try {
    const puzzle = mode === 'practice' ? getPracticePuzzle() : getDailyPuzzle()
    return {
      snapshot: readProgress(puzzle),
      error: '',
      memory: mode === 'practice' && !navigator.locks?.request,
    }
  } catch (error) {
    if (mode === 'practice') {
      return {
        snapshot: {
          revision: null,
          progress: {
            version: 2,
            puzzle: newPracticePuzzle(),
            guesses: [],
            stats: emptyStats(),
            bonus: { offered: false, guess: null, skipped: false },
          },
        },
        error: '',
        memory: true,
      }
    }
    return { snapshot: null, error: errorText(error), memory: false }
  }
}

function Game({
  mode,
  onModeChange,
}: {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
}) {
  const [initial] = useState(() => initialGame(mode))
  const [snapshot, setSnapshot] = useState(initial.snapshot)
  const [error, setError] = useState(initial.error)
  const [currentGuess, setCurrentGuess] = useState('')
  const [bonusEnabled, setBonusEnabled] = useState(
    () => getPreference('qwordle:bonus-enabled') === '1',
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [expired, setExpired] = useState(false)
  const [stale, setStale] = useState(false)
  const [dark, setDark] = useState(() =>
    getPreference('theme')
      ? getPreference('theme') === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [contrast, setContrast] = useState(getStoredIsHighContrastMode)
  const { showError, showSuccess } = useAlert()
  const progress = snapshot?.progress
  const puzzle = progress?.puzzle
  const won = progress ? isWon(progress.guesses, progress.puzzle) : false
  const finished = progress
    ? isFinished(progress.guesses, progress.puzzle)
    : false
  const bonusPending = Boolean(
    won &&
      progress?.bonus.offered &&
      progress.bonus.guess === null &&
      !progress.bonus.skipped,
  )
  const modalOpen = infoOpen || statsOpen || settingsOpen

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('high-contrast', contrast)
  }, [dark, contrast])

  useEffect(() => {
    if (!puzzle || mode === 'practice') return
    const check = () => setExpired(getDailyPuzzle().id !== puzzle.id)
    const timer = window.setInterval(check, 1000)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
    }
  }, [puzzle, mode])

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === `qwordle:v2:${mode}` ||
        (mode === 'daily' && ['gameState', 'gameStats'].includes(event.key))
      )
        setStale(true)
    }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  }, [mode])

  async function submit(skip = false) {
    if (
      !snapshot ||
      busyRef.current ||
      modalOpen ||
      expired ||
      stale ||
      (finished && !bonusPending)
    )
      return
    if (!skip && currentGuess.length !== 5) {
      showError('Not enough letters')
      return
    }
    if (!skip && !isWordInWordList(currentGuess)) {
      showError('Word not found')
      return
    }
    busyRef.current = true
    setBusy(true)
    try {
      const action = skip
        ? { type: 'skip-bonus' as const }
        : bonusPending
          ? { type: 'bonus' as const, word: currentGuess }
          : {
              type: 'guess' as const,
              word: currentGuess,
              offerBonus: bonusEnabled,
            }
      const next = initial.memory
        ? { ...snapshot, progress: advance(snapshot.progress, action) }
        : await commitAction(snapshot, action)
      setSnapshot(next)
      setCurrentGuess('')
      setError('')
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  async function nextPractice() {
    if (!snapshot || busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const next = initial.memory
        ? initialGameInMemory(snapshot)
        : await startPractice(snapshot)
      setSnapshot(next)
      setCurrentGuess('')
      setError('')
      setStale(false)
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const disabled =
    busy || modalOpen || expired || stale || (finished && !bonusPending)
  const remaining =
    won && progress
      ? progress.guesses.includes(puzzle!.solution_A)
        ? puzzle!.solution_B
        : puzzle!.solution_A
      : ''

  return (
    <>
      <div className="flex w-80 mx-auto items-center mb-8 mt-20">
        <h1 className="text-xl ml-2.5 grow font-bold dark:text-white">
          {GAME_TITLE}
        </h1>
        <button
          type="button"
          aria-label="How to play"
          className="cursor-pointer"
          onClick={() => setInfoOpen(true)}
        >
          <InformationCircleIcon className="h-6 w-6 mr-2 dark:stroke-white" />
        </button>
        {mode !== 'practice' && (
          <button
            type="button"
            aria-label="Statistics"
            className="cursor-pointer"
            onClick={() => setStatsOpen(true)}
          >
            <ChartBarIcon className="h-6 w-6 mr-3 dark:stroke-white" />
          </button>
        )}
        <button
          type="button"
          aria-label="Settings"
          className="cursor-pointer"
          onClick={() => setSettingsOpen(true)}
        >
          <CogIcon className="h-6 w-6 mr-3 dark:stroke-white" />
        </button>
      </div>
      {initial.memory && (
        <p role="status" className="text-center mb-4">
          Practice is available without saving in this browser.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="max-w-md mx-auto border border-red-400 rounded p-3 mb-4"
        >
          {error}
        </div>
      )}
      {(expired || stale) && (
        <p role="status" className="text-center mb-4">
          {expired
            ? 'A new daily puzzle is available.'
            : 'Your saved game changed in another tab.'}{' '}
          <button className={button} onClick={() => window.location.reload()}>
            Reload game
          </button>
        </p>
      )}
      {progress && puzzle && (
        <>
          <Grid
            pair={puzzle}
            guesses={progress.guesses}
            currentGuess={finished ? '' : currentGuess}
            currentRowClassName=""
          />
          {finished && (
            <div className="text-center max-w-md mx-auto mb-4" role="status">
              <p className="font-semibold">
                {won
                  ? `Solved in ${progress.guesses.length}/6!`
                  : 'This puzzle is complete.'}
              </p>
              {bonusPending ? (
                <p>
                  Your win is saved. One bonus guess for the other word; your
                  streak is safe.
                </p>
              ) : (
                <p>
                  The words were {puzzle.solution_A} and {puzzle.solution_B}.
                </p>
              )}
              {progress.bonus.guess && (
                <p>
                  {progress.bonus.guess === remaining
                    ? 'Both words found!'
                    : 'Bonus turn complete. Your original win still counts.'}
                </p>
              )}
            </div>
          )}
          {bonusPending && (
            <section aria-label="Bonus turn" className="mb-4">
              <h2 className="text-center font-semibold mb-2">Bonus turn</h2>
              <CurrentRow guess={currentGuess} className="" />
              <div className="text-center mt-2">
                <button
                  disabled={disabled}
                  className={button}
                  onClick={() => void submit(true)}
                >
                  Skip bonus and reveal
                </button>
              </div>
            </section>
          )}
          {progress.bonus.guess && (
            <section aria-label="Bonus result" className="mb-4">
              <CompletedRow
                guess={progress.bonus.guess}
                pair={{ solution_A: remaining, solution_B: '' }}
              />
            </section>
          )}
          <Keyboard
            pair={
              bonusPending ? { solution_A: remaining, solution_B: '' } : puzzle
            }
            guesses={bonusPending ? [] : progress.guesses}
            disabled={disabled}
            onChar={(value) => {
              if (!disabled && /^[A-Z]$/.test(value))
                setCurrentGuess((guess) =>
                  guess.length < 5 ? guess + value : guess,
                )
            }}
            onDelete={() => {
              if (!disabled) setCurrentGuess((guess) => guess.slice(0, -1))
            }}
            onEnter={() => void submit()}
          />
          {mode === 'practice' && (
            <div className="text-center mt-5">
              <button
                disabled={busy}
                className={button}
                onClick={() => void nextPractice()}
              >
                New practice puzzle
              </button>
            </div>
          )}
          {mode !== 'practice' && (
            <StatsModal
              puzzle={puzzle}
              isOpen={statsOpen}
              handleClose={() => setStatsOpen(false)}
              guesses={progress.guesses}
              gameStats={progress.stats}
              isGameLost={finished && !won}
              isGameWon={won}
              handleShare={() => showSuccess('Result shared')}
              isHardMode={getPreference('gameMode') === 'hard'}
            />
          )}
        </>
      )}
      <InfoModal isOpen={infoOpen} handleClose={() => setInfoOpen(false)} />
      <SettingsModal
        isOpen={settingsOpen}
        handleClose={() => setSettingsOpen(false)}
        isDarkMode={dark}
        handleDarkMode={(value: boolean) => {
          setDark(value)
          setPreference('theme', value ? 'dark' : 'light')
        }}
        isHighContrastMode={contrast}
        handleHighContrastMode={(value: boolean) => {
          setContrast(value)
          setStoredIsHighContrastMode(value)
        }}
        isBonusTurn={bonusEnabled}
        handleBonusTurn={(value: boolean) => {
          setBonusEnabled(value)
          setPreference('qwordle:bonus-enabled', value ? '1' : '0')
        }}
        isPracticeMode={mode === 'practice'}
        handlePracticeMode={(value: boolean) => {
          onModeChange(value ? 'practice' : 'daily')
          setSettingsOpen(false)
        }}
      />
    </>
  )
}

function initialGameInMemory(snapshot: Snapshot): Snapshot {
  return {
    revision: null,
    progress: {
      version: 2,
      puzzle: newPracticePuzzle(snapshot.progress.puzzle),
      guesses: [],
      stats: emptyStats(),
      bonus: { offered: false, guess: null, skipped: false },
    },
  }
}

export default function App() {
  const [mode, setMode] = useState<GameMode>('daily')
  return (
    <div className="pt-2 pb-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
      <Game key={mode} mode={mode} onModeChange={setMode} />
      <AlertContainer />
    </div>
  )
}
