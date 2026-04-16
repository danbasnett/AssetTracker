'use client'

import { useActionState, useState } from 'react'
import { deleteLocations } from '../app/actions'

type Location = {
  id: number
  name: string
  parentId: number | null
  parent: { name: string } | null
}

export default function LocationTable({ locations }: { locations: Location[] }) {
  const [state, formAction] = useActionState(deleteLocations, null)
  const [selected, setSelected] = useState<number[]>([])

  function toggle(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    if (selected.length === 0) {
      e.preventDefault()
      return
    }
    if (!confirm(`Delete ${selected.length} location(s)? This cannot be undone.`)) {
      e.preventDefault()
      return
    }
    setSelected([])
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {state?.error && (
        <p className="text-red-400 text-sm mb-3">{state.error}</p>
      )}

      {selected.filter(id => locations.some(l => l.id === id)).length > 0 && (
        <div className="mb-3">
          <button type="submit"
            className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium">
            Delete {selected.filter(id => locations.some(l => l.id === id)).length} selected
          </button>
        </div>
      )}

      {selected.map(id => (
        <input key={id} type="hidden" name="selectedIds" value={id} />
      ))}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {locations.length === 0 ? (
          <p className="p-6 text-zinc-400">No locations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="p-4 text-left w-8"></th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Parent</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => (
                <tr key={location.id} className="border-b border-zinc-800 last:border-0">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(location.id)}
                      onChange={() => toggle(location.id)}
                      className="w-4 h-4 accent-white align-middle"
                    />
                  </td>
                  <td className="p-4">{location.name}</td>
                  <td className="p-4 text-zinc-400">{location.parent?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </form>
  )
}
