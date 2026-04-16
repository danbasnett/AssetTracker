'use client'

import { useActionState, useState } from 'react'
import { addAsset } from '../app/actions'

type Location = {
  id: number
  name: string
}

export default function AddAssetForm({ locations }: { locations: Location[] }) {
  const [state, formAction] = useActionState(addAsset, null)
  const [name, setName] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [status, setStatus] = useState('available')
  const [locationId, setLocationId] = useState('')

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <input name="name" placeholder="Asset name" required value={name} onChange={e => setName(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700" />
        <input name="assetTag" placeholder="Tag e.g. DRILL-001" required value={assetTag} onChange={e => setAssetTag(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700" />
        <select name="status" value={status} onChange={e => setStatus(e.target.value)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white border border-zinc-700">
          <option value="available">Available</option>
          <option value="checked_out">Checked Out</option>
          <option value="repair">Repair</option>
          <option value="retired">Retired</option>
        </select>
        <select
	  name="locationId"
	  value={locationId}
	  onChange={e => setLocationId(e.target.value)}
	  className="rounded-xl bg-zinc-800 px-4 py-2 pr-8 text-white border border-zinc-700">
	  <option value="">No location</option>
	  {locations.map(loc => (
	    <option key={loc.id} value={loc.id}>{loc.name}</option>
	  ))}
	</select>
	  <button type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black font-medium">
          Add Asset
        </button>
      </div>
    </form>
  )
}
