'use client'

import { useState } from 'react'
import type { GameSource } from '@/types'

interface ImportStatus {
  readonly loading: boolean
  readonly result: { imported: number; total: number } | null
  readonly error: string | null
}

export default function SettingsPage() {
  const [chesscomUsername, setChesscomUsername] = useState('')
  const [lichessUsername, setLichessUsername] = useState('')
  const [importStatus, setImportStatus] = useState<
    Record<GameSource, ImportStatus>
  >({
    chesscom: { loading: false, result: null, error: null },
    lichess: { loading: false, result: null, error: null },
  })

  async function handleImport(source: GameSource) {
    const username =
      source === 'chesscom' ? chesscomUsername : lichessUsername
    if (!username.trim()) return

    setImportStatus((prev) => ({
      ...prev,
      [source]: { loading: true, result: null, error: null },
    }))

    try {
      const res = await fetch('/api/games/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), source, limit: 200 }),
      })

      const data = await res.json()

      if (!data.success) {
        setImportStatus((prev) => ({
          ...prev,
          [source]: { loading: false, result: null, error: data.error },
        }))
        return
      }

      setImportStatus((prev) => ({
        ...prev,
        [source]: { loading: false, result: data.data, error: null },
      }))
    } catch {
      setImportStatus((prev) => ({
        ...prev,
        [source]: {
          loading: false,
          result: null,
          error: 'Network error. Please try again.',
        },
      }))
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-2xl font-bold">Settings</h1>

      <div className="space-y-8">
        {/* Chess.com */}
        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold">Chess.com</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={chesscomUsername}
              onChange={(e) => setChesscomUsername(e.target.value)}
              placeholder="Chess.com username"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={() => handleImport('chesscom')}
              disabled={
                importStatus.chesscom.loading || !chesscomUsername.trim()
              }
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {importStatus.chesscom.loading ? 'Importing...' : 'Import Games'}
            </button>
          </div>
          {importStatus.chesscom.result && (
            <p className="mt-3 text-sm text-green-600">
              Imported {importStatus.chesscom.result.imported} new games (
              {importStatus.chesscom.result.total} total fetched)
            </p>
          )}
          {importStatus.chesscom.error && (
            <p className="mt-3 text-sm text-red-600">
              {importStatus.chesscom.error}
            </p>
          )}
        </section>

        {/* Lichess */}
        <section className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
          <h2 className="mb-4 text-lg font-semibold">Lichess</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={lichessUsername}
              onChange={(e) => setLichessUsername(e.target.value)}
              placeholder="Lichess username"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={() => handleImport('lichess')}
              disabled={
                importStatus.lichess.loading || !lichessUsername.trim()
              }
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {importStatus.lichess.loading ? 'Importing...' : 'Import Games'}
            </button>
          </div>
          {importStatus.lichess.result && (
            <p className="mt-3 text-sm text-green-600">
              Imported {importStatus.lichess.result.imported} new games (
              {importStatus.lichess.result.total} total fetched)
            </p>
          )}
          {importStatus.lichess.error && (
            <p className="mt-3 text-sm text-red-600">
              {importStatus.lichess.error}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
