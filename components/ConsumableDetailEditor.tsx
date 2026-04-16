'use client'

import { useState, useTransition } from 'react'
import { updateConsumable } from '../app/actions'

type Location = { id: number; name: string }

type Consumable = {
  id: number
  name: string
  quantity: number
  reorderPoint: number
  unit: string
  modelNumber: string | null
  locationId: number | null
  location: { name: string } | null
  createdAt: Date
}

export default function ConsumableDetailEditor({ item, locations }: { item: Consumable; locations: Location[] }) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({
    name: item.name,
    quantity: String(item.quantity),
    reorderPoint: String(item.reorderPoint),
    unit: item.unit,
    modelNumber: item.modelNumber ?? '',
    locationId: item.locationId ? String(item.locationId) : '',
  })
  const [isPending, startTransition] = useTransition()

  const quantity = parseInt(values.quantity) || 0
  const reorderPoint = parseInt(values.reorderPoint) || 0
  const isLow = quantity > 0 && quantity <= reorderPoint
  const isEmpty = quantity === 0

  function save() {
    const formData = new FormData()
    formData.append('id', String(item.id))
    formData.append('name', values.name)
    formData.append('quantity', values.quantity)
    formData.append('reorderPoint', values.reorderPoint)
    formData.append('unit', values.unit)
    formData.append('modelNumber', values.modelNumber)
    formData.append('locationId', values.locationId)

    startTransition(async () => {
      await updateConsumable(null, formData)
      setEditing(false)
    })
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-zinc-400">Details</span>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} disabled={isPending}
              className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setEditing(false)}
              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Name</span>
          {editing ? (
            <input value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{item.name}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Quantity</span>
          {editing ? (
            <input type="number" min="0" value={values.quantity} onChange={e => setValues(v => ({ ...v, quantity: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-28" />
          ) : <span className={isEmpty ? 'text-red-400' : isLow ? 'text-yellow-400' : ''}>{item.quantity} {item.unit}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Reorder Point</span>
          {editing ? (
            <input type="number" min="0" value={values.reorderPoint} onChange={e => setValues(v => ({ ...v, reorderPoint: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-28" />
          ) : <span>{item.reorderPoint} {item.unit}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Unit</span>
          {editing ? (
            <input value={values.unit} onChange={e => setValues(v => ({ ...v, unit: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-28" />
          ) : <span>{item.unit}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Model Number</span>
          {editing ? (
            <input value={values.modelNumber} onChange={e => setValues(v => ({ ...v, modelNumber: e.target.value }))}
              placeholder="—"
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{item.modelNumber ?? '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Location</span>
          {editing ? (
            <select value={values.locationId} onChange={e => setValues(v => ({ ...v, locationId: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm">
              <option value="">No location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          ) : <span>{item.location?.name ?? '—'}</span>}
        </div>
        <div className="flex justify-between px-6 py-4">
          <span className="text-zinc-400">Added</span>
          <span>{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
      </div>
    </div>
  )
}
