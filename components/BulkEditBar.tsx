'use client'

import { useActionState } from 'react'
import { bulkUpdateAssets } from '../app/actions'

type Location = {
  id: number
  name: string
}

type Status = {
  id: number
  name: string
}

export default function BulkEditBar({ selectedIds, locations, statuses, onSuccess }: {
  selectedIds: number[]
  locations: Location[]
  statuses: Status[]
  onSuccess: () => void
}) {
  const [state, formAction] = useActionState(bulkUpdateAssets, null)

  if (selectedIds.length < 2) return null

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-center">
      {selectedIds.map(id => (
        <input key={id} type="hidden" name="selectedIds" value={id} />
      ))}

      <select name="status" defaultValue=""
        className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm">
        <option value="">— status —</option>
        {statuses.map(s => (
          <option key={s.id} value={s.name}>{s.name}</option>
        ))}
      </select>

      <select name="locationId" defaultValue=""
        className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm">
        <option value="">— location —</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <button type="submit"
        className="rounded-xl bg-zinc-700 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-600">
        Apply
      </button>

      {state?.error && (
        <span className="text-red-400 text-sm">{state.error}</span>
      )}
    </form>
  )
}
