'use client'

import { useActionState, useTransition } from 'react'
import { addStatus, deleteStatus } from '../app/actions'

type Status = { id: number; name: string }

const DEFAULT_STATUSES = ['Assigned', 'Available', 'Checked Out', 'Repair Needed', 'Retired', 'Booked']

function DeleteStatusButton({ id, name }: { id: number; name: string }) {
  const [, startTransition] = useTransition()

  if (DEFAULT_STATUSES.includes(name)) {
    return <span className="text-xs text-zinc-600 italic">default</span>
  }

  function handleDelete() {
    const formData = new FormData()
    formData.append('id', String(id))
    startTransition(async () => {
      await deleteStatus(null, formData)
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">
      Remove
    </button>
  )
}

export default function SettingsStatusList({ statuses }: { statuses: Status[] }) {
  const [state, formAction] = useActionState(addStatus, null)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {statuses.length === 0 ? (
          <p className="px-6 py-4 text-zinc-400 text-sm">No statuses yet. Add one below.</p>
        ) : (
          statuses.map(status => (
            <div key={status.id} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm">{status.name}</span>
              <DeleteStatusButton id={status.id} name={status.name} />
            </div>
          ))
        )}
      </div>

      <form action={formAction} className="flex gap-2">
        <input
          name="name"
          placeholder="New status name"
          required
          className="flex-1 rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
        />
        <button type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
          Add
        </button>
      </form>

      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
    </div>
  )
}
