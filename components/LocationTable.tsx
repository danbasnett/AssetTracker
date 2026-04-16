'use client'

import { useActionState, useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteLocations, updateLocation } from '../app/actions'
import { SortIcon, sortRows, thCls, type SortDir } from './SortableHeader'

type Location = {
  id: number
  name: string
  parentId: number | null
  parent: { name: string } | null
}

function getDescendantIds(id: number, locations: Location[]): Set<number> {
  const result = new Set<number>()
  const queue = [id]
  while (queue.length) {
    const cur = queue.shift()!
    for (const l of locations) {
      if (l.parentId === cur && !result.has(l.id)) {
        result.add(l.id)
        queue.push(l.id)
      }
    }
  }
  return result
}

function EditRow({ location, locations, onDone }: { location: Location; locations: Location[]; onDone: () => void }) {
  const [name, setName] = useState(location.name)
  const [parentId, setParentId] = useState(location.parentId ? String(location.parentId) : '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const formData = new FormData()
    formData.append('id', String(location.id))
    formData.append('name', name)
    formData.append('parentId', parentId)
    setError(null)
    startTransition(async () => {
      const result = await updateLocation(null, formData)
      if ((result as any)?.error) setError((result as any).error)
      else onDone()
    })
  }

  return (
    <tr className="border-b border-zinc-800 bg-zinc-800/40">
      <td className="p-4" />
      <td className="p-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-white border border-zinc-600 text-sm w-full focus:outline-none focus:border-zinc-400"
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </td>
      <td className="p-3">
        <select
          value={parentId}
          onChange={e => setParentId(e.target.value)}
          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-white border border-zinc-600 text-sm focus:outline-none focus:border-zinc-400"
        >
          <option value="">No parent</option>
          {locations.filter(l => l.id !== location.id && !getDescendantIds(location.id, locations).has(l.id)).map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function LocationTable({ locations, canEdit }: { locations: Location[], canEdit: boolean }) {
  const [state, formAction] = useActionState(deleteLocations, null)
  const [selected, setSelected] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = locations.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.parent?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const sorted = sortRows(
    filtered.map(l => ({ ...l, parentName: l.parent?.name ?? '' })),
    sortKey, sortDir
  )

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function handleSubmit(e: React.FormEvent) {
    if (selected.length === 0) { e.preventDefault(); return }
    if (!confirm(`Delete ${selected.length} location(s)? This cannot be undone.`)) { e.preventDefault(); return }
    setSelected([])
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {state?.error && <p className="text-red-400 text-sm mb-3">{state.error}</p>}

      {canEdit && selected.filter(id => locations.some(l => l.id === id)).length > 0 && (
        <div className="mb-3">
          <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium">
            Delete {selected.filter(id => locations.some(l => l.id === id)).length} selected
          </button>
        </div>
      )}

      {selected.map(id => <input key={id} type="hidden" name="selectedIds" value={id} />)}

      <input
        type="search"
        placeholder="Search locations…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
      />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {locations.length === 0 ? (
          <p className="p-6 text-zinc-400">No locations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                {canEdit && <th className="p-4 text-left w-8"></th>}
                <th className={thCls} onClick={() => toggleSort('name')}>Name <SortIcon active={sortKey==='name'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('parentName')}>Parent <SortIcon active={sortKey==='parentName'} dir={sortDir} /></th>
                {canEdit && <th className="p-4 w-24"></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(location =>
                editingId === location.id ? (
                  <EditRow
                    key={location.id}
                    location={location}
                    locations={locations}
                    onDone={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={location.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40">
                    {canEdit && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(location.id)}
                          onChange={() => toggle(location.id)}
                          className="w-4 h-4 accent-white align-middle"
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <Link href={`/locations/${location.id}`} className="hover:underline font-medium">
                        {location.name}
                      </Link>
                    </td>
                    <td className="p-4 text-zinc-400">{location.parent?.name ?? '—'}</td>
                    {canEdit && (
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setEditingId(location.id)}
                          className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </form>
  )
}
