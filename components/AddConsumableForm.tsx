'use client'

import { useActionState, useState } from 'react'
import { addConsumable } from '../app/actions'

type Location = { id: number; name: string }

export default function AddConsumableForm({ locations }: { locations: Location[] }) {
  const [, formAction] = useActionState(addConsumable, null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [reorderPoint, setReorderPoint] = useState('5')
  const [unit, setUnit] = useState('each')
  const [locationId, setLocationId] = useState('')
  const [modelNumber, setModelNumber] = useState('')

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">

      <div className="flex flex-wrap gap-3">
        <input name="name" placeholder="Item name" required value={name} onChange={e => setName(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700" />
        <input name="quantity" type="number" min="0" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 w-28" />
        <input name="reorderPoint" type="number" min="0" placeholder="Reorder at" value={reorderPoint} onChange={e => setReorderPoint(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 w-28" />
        <input name="unit" placeholder="Unit (each, box…)" value={unit} onChange={e => setUnit(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 w-36" />
        <input name="modelNumber" placeholder="Model number" value={modelNumber} onChange={e => setModelNumber(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700" />
        <select name="locationId" value={locationId} onChange={e => setLocationId(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white border border-zinc-700">
          <option value="">No location</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <button type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black font-medium">
          Add Item
        </button>
      </div>
    </form>
  )
}
