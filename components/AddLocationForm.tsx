'use client'

import { useActionState } from 'react'
import { addLocation } from '../app/actions'

type Location = {
  id: number
  name: string
  parentId: number | null
}

export default function AddLocationForm({ locations }: { locations: Location[] }) {
  const [state, formAction] = useActionState<{ error?: string } | null, FormData>(addLocation, null)

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          name="name"
          placeholder="Location name"
          required
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700" />
        <select
          name="parentId"
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white border border-zinc-700">
          <option value="">No parent</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <button type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black font-medium">
          Add Location
        </button>
      </div>
    </form>
  )
}
