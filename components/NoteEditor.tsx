'use client'

import { useState, useTransition } from 'react'

type Props = {
  initialNotes: string | null
  canEdit: boolean
  onSave: (notes: string) => Promise<void>
}

export default function NoteEditor({ initialNotes, canEdit, onSave }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await onSave(notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm text-zinc-400 mb-2">Notes</h2>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        rows={4}
        readOnly={!canEdit}
        placeholder={canEdit ? 'Add notes...' : ''}
        className={`w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-600 ${!canEdit ? 'opacity-60 cursor-default' : ''}`}
      />
      {canEdit && (
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium disabled:opacity-50">
            Save
          </button>
          {saved && <span className="text-zinc-400 text-sm">Saved</span>}
        </div>
      )}
    </div>
  )
}
