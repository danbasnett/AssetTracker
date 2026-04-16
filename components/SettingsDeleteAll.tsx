'use client'

import { useState, useTransition } from 'react'
import { deleteAllData } from '../app/actions'

export default function SettingsDeleteAll() {
  const [step, setStep] = useState<'idle' | 'confirm'>('idle')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (typed !== 'DELETE') return
    setError(null)
    startTransition(async () => {
      const result = await deleteAllData()
      if ((result as any)?.error) {
        setError((result as any).error)
      } else {
        setStep('idle')
        setTyped('')
      }
    })
  }

  if (step === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStep('confirm')}
        className="rounded-xl bg-red-900 border border-red-700 px-4 py-2 text-red-300 text-sm font-medium hover:bg-red-800 transition-colors">
        Delete All Data
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-red-800 bg-red-950/40 p-6 space-y-4">
      <h3 className="text-red-300 font-semibold">This will permanently delete:</h3>
      <ul className="text-sm text-red-400 list-disc list-inside space-y-1">
        <li>All assets</li>
        <li>All people</li>
        <li>All locations</li>
        <li>All consumables</li>
        <li>All maintenance records</li>
        <li>All allocations</li>
      </ul>
      <p className="text-sm text-zinc-400">This cannot be undone. Type <span className="font-mono font-bold text-white">DELETE</span> to confirm.</p>
      <input
        value={typed}
        onChange={e => setTyped(e.target.value)}
        placeholder="Type DELETE to confirm"
        className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white border border-zinc-700 focus:outline-none focus:border-red-500 font-mono"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={typed !== 'DELETE' || isPending}
          className="rounded-xl bg-red-700 px-4 py-2 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {isPending ? 'Deleting…' : 'Delete Everything'}
        </button>
        <button
          type="button"
          onClick={() => { setStep('idle'); setTyped('') }}
          className="rounded-xl bg-zinc-700 px-4 py-2 text-white text-sm hover:bg-zinc-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
