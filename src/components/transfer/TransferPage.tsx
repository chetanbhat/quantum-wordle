import { useEffect, useState } from 'react'
import { GAME_TITLE } from '../../constants/strings'

const TRANSFER_KEYS = ['gameState', 'gameStats', 'highContrast', 'theme', 'gameMode']

function collectLocalStorage(): string {
  const data: Record<string, string | null> = {}
  for (const key of TRANSFER_KEYS) {
    data[key] = localStorage.getItem(key)
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))))
}

function applyLocalStorage(encoded: string): void {
  const data = JSON.parse(
    decodeURIComponent(escape(atob(encoded)))
  ) as Record<string, string | null>
  for (const [key, value] of Object.entries(data)) {
    if (TRANSFER_KEYS.includes(key)) {
      if (value !== null) {
        localStorage.setItem(key, value)
      } else {
        localStorage.removeItem(key)
      }
    }
  }
}

type PageState = 'export' | 'importing' | 'success' | 'error'

export function TransferPage() {
  const [pageState, setPageState] = useState<PageState>('export')
  const [transferUrl, setTransferUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDark] = useState(
    () => localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const data = params.get('data')

    if (data) {
      setPageState('importing')
      try {
        applyLocalStorage(data)
        setPageState('success')
        setTimeout(() => {
          window.location.href = window.location.origin + '/'
        }, 2000)
      } catch {
        setPageState('error')
      }
    } else {
      const encoded = collectLocalStorage()
      const url = `${window.location.origin}/transfer?data=${encoded}`
      setTransferUrl(url)
    }
  }, [])

  const copyUrl = () => {
    navigator.clipboard.writeText(transferUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          {GAME_TITLE}
        </h1>

        {pageState === 'importing' && (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
            <p>Importing your data...</p>
          </div>
        )}

        {pageState === 'success' && (
          <div className="mt-8 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 text-center">
            <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
              Transfer complete!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your streak data has been restored. Redirecting you to the game...
            </p>
          </div>
        )}

        {pageState === 'error' && (
          <div className="mt-8 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <p className="text-lg font-semibold text-red-800 dark:text-red-200 mb-1">
              Transfer failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              The link may be invalid or corrupted. Please generate a new one from your original device.
            </p>
            <a
              href="/"
              className="text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Go back to the game
            </a>
          </div>
        )}

        {pageState === 'export' && (
          <div className="mt-8">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Transfer to a new device
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Copy the link below and open it on your new device. It contains your streak and game data encoded in the URL — no account needed.
              </p>

              <textarea
                readOnly
                value={transferUrl}
                rows={4}
                className="w-full text-xs font-mono bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-3 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />

              <button
                onClick={copyUrl}
                className="mt-3 w-full py-2 px-4 rounded font-semibold text-sm transition-colors duration-150 bg-green-600 hover:bg-green-700 text-white"
              >
                {copied ? 'Copied!' : 'Copy transfer link'}
              </button>
            </div>

            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
              <a href="/" className="underline">
                Back to the game
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
