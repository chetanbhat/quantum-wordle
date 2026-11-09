import { useEffect, useState } from 'react'
import { GAME_TITLE } from '../../constants/strings'
import {
  collectBackup,
  decodeTransfer,
  encodeTransfer,
  importTransfer,
  previewTransfer,
} from '../../lib/transfer'

export function TransferPage() {
  const [incoming] = useState(() =>
    new URLSearchParams(window.location.search).get('data'),
  )
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [preview] = useState(() => {
    if (!incoming) return null
    try {
      const data = decodeTransfer(incoming)
      return { data, progress: previewTransfer(data), error: '' }
    } catch {
      return {
        data: null,
        progress: null,
        error:
          'This transfer is invalid or contains conflicting saves. Nothing has been changed.',
      }
    }
  })
  useEffect(() => {
    // Remove saved game contents from the address bar and referrers immediately.
    if (incoming) window.history.replaceState(null, '', '/transfer')
  }, [incoming])

  const download = () => {
    try {
      const blob = new Blob([JSON.stringify(collectBackup(), null, 2)], {
        type: 'application/json',
      })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'qwordle-backup.json'
      link.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setMessage('Backup downloaded. Keep this file somewhere safe.')
    } catch {
      setMessage('Browser storage is unavailable. No data was changed.')
    }
  }
  return (
    <main className="max-w-lg mx-auto p-6 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">
        {GAME_TITLE} transfer / backup
      </h1>
      <p className="mb-4">
        Transfer your classic progress to a browser with no classic save.
        Existing progress is never replaced. Fresh daily and practice saves are
        included in the backup file for safekeeping, but are not imported.
      </p>
      <button className="border rounded px-3 py-2 mb-4" onClick={download}>
        Download full backup
      </button>
      {preview ? (
        <section>
          {preview.error && <p role="alert">{preview.error}</p>}
          {preview.progress && (
            <>
              <h2 className="font-semibold">Review classic progress</h2>
              <p>
                {preview.progress.stats.totalGames} games, current streak{' '}
                {preview.progress.stats.currentStreak}, best streak{' '}
                {preview.progress.stats.bestStreak}.
              </p>
              <button
                disabled={busy || done}
                className="border rounded px-3 py-2 mt-4"
                onClick={async () => {
                  if (!preview.data || busy) return
                  setBusy(true)
                  try {
                    await importTransfer(preview.data)
                    setDone(true)
                    setMessage(
                      'Classic progress imported successfully. You can return to the game.',
                    )
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : 'Transfer failed. Existing data has been kept.',
                    )
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Import classic progress
              </button>
            </>
          )}
        </section>
      ) : (
        <section>
          <button
            className="border rounded px-3 py-2 mb-4"
            onClick={() => {
              try {
                const data = collectBackup()
                previewTransfer(data)
                const transfer = new URL('/transfer', window.location.origin)
                transfer.searchParams.set('data', encodeTransfer(data))
                setUrl(transfer.toString())
                setMessage(
                  'Keep this link private. Open it on your new device to review the import.',
                )
              } catch {
                setMessage(
                  'A valid transfer could not be created. Download a full backup to preserve the existing data.',
                )
              }
            }}
          >
            Create transfer link
          </button>
          {url && (
            <>
              <textarea
                aria-label="Transfer link"
                className="w-full p-2 border rounded text-black"
                rows={5}
                readOnly
                value={url}
                onClick={(event) => event.currentTarget.select()}
              />
              <button
                className="border rounded px-3 py-2 my-3"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url)
                    setMessage('Transfer link copied.')
                  } catch {
                    setMessage(
                      'Copy is unavailable. Select and copy the link above.',
                    )
                  }
                }}
              >
                Copy transfer link
              </button>
            </>
          )}
        </section>
      )}
      {message && (
        <p role="status" className="my-4">
          {message}
        </p>
      )}
      <p className="mt-6">
        <a className="underline" href="/">
          Back to the game
        </a>
      </p>
    </main>
  )
}
