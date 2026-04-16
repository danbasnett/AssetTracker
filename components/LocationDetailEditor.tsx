'use client'

import { useState, useTransition } from 'react'
import { updateLocation, updateLocationDetails } from '../app/actions'

type Location = { id: number; name: string; parentId: number | null; address: string | null; notes: string | null }

export default function LocationDetailEditor({
  location,
  allLocations,
  canEdit,
}: {
  location: Location
  allLocations: { id: number; name: string }[]
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({
    name: location.name,
    parentId: location.parentId ? String(location.parentId) : '',
    address: location.address ?? '',
    notes: location.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    setError(null)
    startTransition(async () => {
      const nameForm = new FormData()
      nameForm.append('id', String(location.id))
      nameForm.append('name', values.name)
      nameForm.append('parentId', values.parentId)

      const detailForm = new FormData()
      detailForm.append('id', String(location.id))
      detailForm.append('address', values.address)
      detailForm.append('notes', values.notes)

      const [r1, r2] = await Promise.all([
        updateLocation(null, nameForm),
        updateLocationDetails(null, detailForm),
      ])

      const err = (r1 as any)?.error || (r2 as any)?.error
      if (err) setError(err)
      else setEditing(false)
    })
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-zinc-400">Details</span>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)}
            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
            Edit
          </button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={save} disabled={isPending}
              className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">
              Save
            </button>
            <button onClick={() => { setEditing(false); setError(null); setValues({ name: location.name, parentId: location.parentId ? String(location.parentId) : '', address: location.address ?? '', notes: location.notes ?? '' }) }}
              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Name</span>
          {editing ? (
            <input value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-56 focus:outline-none focus:border-zinc-500" />
          ) : <span>{location.name}</span>}
        </div>

        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Parent</span>
          {editing ? (
            <select value={values.parentId} onChange={e => setValues(v => ({ ...v, parentId: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm focus:outline-none focus:border-zinc-500">
              <option value="">None</option>
              {allLocations.filter(l => l.id !== location.id).map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          ) : <span>{allLocations.find(l => l.id === location.parentId)?.name ?? '—'}</span>}
        </div>

        <div className="flex justify-between items-start px-6 py-4">
          <span className="text-zinc-400">Address</span>
          {editing ? (
            <textarea value={values.address} onChange={e => setValues(v => ({ ...v, address: e.target.value }))}
              rows={3} placeholder="Enter address…"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm w-56 resize-none focus:outline-none focus:border-zinc-500" />
          ) : <span className="text-right whitespace-pre-wrap max-w-xs">{location.address || '—'}</span>}
        </div>

        <div className="flex justify-between items-start px-6 py-4">
          <span className="text-zinc-400">Notes</span>
          {editing ? (
            <textarea value={values.notes} onChange={e => setValues(v => ({ ...v, notes: e.target.value }))}
              rows={3} placeholder="Enter notes…"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm w-56 resize-none focus:outline-none focus:border-zinc-500" />
          ) : <span className="text-right whitespace-pre-wrap max-w-xs">{location.notes || '—'}</span>}
        </div>

        <div className="flex justify-between px-6 py-4">
          <span className="text-zinc-400">Added</span>
          <span>{new Date((location as any).createdAt).toLocaleDateString('en-GB')}</span>
        </div>
      </div>
    </div>
  )
}
