'use client'

import { useActionState, useState, useTransition } from 'react'
import { deleteConsumables, updateConsumable, adjustConsumableQuantity } from '../app/actions'
import SearchBar from './SearchBar'
import Link from 'next/link'

type Location = { id: number; name: string }

type Consumable = {
  id: number
  name: string
  quantity: number
  reorderPoint: number
  unit: string
  locationId: number | null
  location: { name: string } | null
}

export default function ConsumableTable({ consumables, locations }: { consumables: Consumable[], locations: Location[] }) {
  const [deleteState, deleteAction] = useActionState(deleteConsumables, null)
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Consumable & { locationId: number | null }>>({})
  const [isPending, startTransition] = useTransition()

  const filtered = consumables.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function startEdit(item: Consumable) {
    setEditingId(item.id)
    setEditValues({
      name: item.name,
      quantity: item.quantity,
      reorderPoint: item.reorderPoint,
      unit: item.unit,
      locationId: item.locationId ?? null
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  function saveEdit(id: number) {
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('name', editValues.name ?? '')
    formData.append('quantity', String(editValues.quantity ?? 0))
    formData.append('reorderPoint', String(editValues.reorderPoint ?? 0))
    formData.append('unit', editValues.unit ?? '')
    formData.append('locationId', editValues.locationId ? String(editValues.locationId) : '')

    startTransition(async () => {
      await updateConsumable(null, formData)
      setEditingId(null)
      setEditValues({})
    })
  }

  function handleDeleteSubmit(e: { preventDefault: () => void }) {
    if (selected.length === 0) {
      e.preventDefault()
      return
    }
    if (!confirm(`Delete ${selected.length} item(s)? This cannot be undone.`)) {
      e.preventDefault()
      return
    }
    setSelected([])
  }

  return (
    <div>
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <form action={deleteAction} onSubmit={handleDeleteSubmit}>
        {deleteState?.error && (
          <p className="text-red-400 text-sm mb-3">{deleteState.error}</p>
        )}

        {selected.filter(id => consumables.some(c => c.id === id)).length > 0 && (
          <div className="mb-3">
            <button type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium">
              Delete {selected.filter(id => consumables.some(c => c.id === id)).length} selected
            </button>
          </div>
        )}

        {selected.map(id => (
          <input key={id} type="hidden" name="selectedIds" value={id} />
        ))}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-zinc-400">
              {search ? 'No items match your search.' : 'No items yet.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="p-4 text-left w-8"></th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Quantity</th>
                  <th className="p-4 text-left">Reorder At</th>
                  <th className="p-4 text-left">Unit</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className={`border-b border-zinc-800 last:border-0 ${item.quantity === 0 ? 'bg-red-950' : item.quantity <= item.reorderPoint ? 'bg-yellow-950' : ''}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggle(item.id)}
                        className="w-4 h-4 accent-white align-middle"
                      />
                    </td>

                    {editingId === item.id ? (
                      <>
                        <td className="p-2">
                          <input value={editValues.name ?? ''} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full" />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" value={editValues.quantity ?? 0} onChange={e => setEditValues(v => ({ ...v, quantity: parseInt(e.target.value) || 0 }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-24" />
                        </td>
                        <td className="p-2">
                          <input type="number" min="0" value={editValues.reorderPoint ?? 0} onChange={e => setEditValues(v => ({ ...v, reorderPoint: parseInt(e.target.value) || 0 }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-24" />
                        </td>
                        <td className="p-2">
                          <input value={editValues.unit ?? ''} onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-28" />
                        </td>
                        <td className="p-2">
                          <select value={editValues.locationId ?? ''} onChange={e => setEditValues(v => ({ ...v, locationId: e.target.value ? parseInt(e.target.value) : null }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700">
                            <option value="">No location</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => saveEdit(item.id)} disabled={isPending}
                              className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">
                              Save
                            </button>
                            <button type="button" onClick={cancelEdit}
                              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">
                          <Link href={`/items/${item.id}`} className="hover:underline">
                            {item.name}
                          </Link>
                        </td>
                        <td className="p-4">{item.quantity}</td>
                        <td className="p-4 text-zinc-400">{item.reorderPoint}</td>
                        <td className="p-4 text-zinc-400">{item.unit}</td>
                        <td className="p-4 text-zinc-400">{item.location?.name ?? '—'}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => startTransition(() => adjustConsumableQuantity(item.id, -1))}
                              disabled={isPending || item.quantity === 0}
                              className="rounded-lg bg-zinc-700 w-7 h-7 text-white text-sm font-bold hover:bg-zinc-600 disabled:opacity-30">
                              −
                            </button>
                            <button type="button" onClick={() => startTransition(() => adjustConsumableQuantity(item.id, 1))}
                              disabled={isPending}
                              className="rounded-lg bg-zinc-700 w-7 h-7 text-white text-sm font-bold hover:bg-zinc-600 disabled:opacity-30">
                              +
                            </button>
                            <button type="button" onClick={() => startEdit(item)}
                              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
                              Edit
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </form>
    </div>
  )
}
