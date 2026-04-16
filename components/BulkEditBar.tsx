'use client'

import { useActionState } from 'react'
import { bulkUpdateAssets } from '../app/actions'

type Location = {
  id: number
  name: string
}

export default function BulkEditBar({ selectedIds, locations, onSuccess }: {
  selectedIds: number[]
  locations: Location[]
  onSuccess: () => void
}) {
  const [state, formAction] = useActionState(bulkUpdateAssets, null)

  if (selectedIds.length < 2) return null

  return (
    <div className="mb-3 p-3 rounded-xl border border-zinc-700 bg-zinc-800 flex flex-wrap gap-3 items-center">
      <span className="text-sm text-zinc-400">{selectedIds.length} selected — bulk edit:</span>

      <form action={formAction} className="flex flex-wrap gap-3 items-center">
        {selectedIds.map(id => (
          <input key={id} type="hidden" name="selectedIds" value={id} />
        ))}

        <select name="status" defaultValue=""
          className="rounded-lg bg-zinc-900 px-3 py-1 text-white border border-zinc-700 text-sm">
          <option value="">— status —</option>
          <option value="available">Available</option>
          <option value="checked_out">Checked Out</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>

        <select name="locationId" defaultValue=""
          className="rounded-lg bg-zinc-900 px-3 py-1 text-white border border-zinc-700 text-sm">
          <option value="">— location —</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <button type="submit"
          className="rounded-lg bg-white px-3 py-1 text-black text-sm font-medium">
          Apply
        </button>

        {state?.error && (
          <span className="text-red-400 text-sm">{state.error}</span>
        )}
      </form>
    </div>
  )
}
