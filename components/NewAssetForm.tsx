'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addAsset } from '../app/actions'

type Location = { id: number; name: string }

export default function NewAssetForm({ locations }: { locations: Location[] }) {
  const [state, formAction] = useActionState(addAsset, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push('/assets')
  }, [state])

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Basic Info</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Name <span className="text-red-400">*</span></label>
            <input name="name" required placeholder="e.g. DeWalt Drill"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Asset Tag <span className="text-red-400">*</span></label>
            <input name="assetTag" required placeholder="e.g. DRILL-001"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Status</label>
            <select name="status" defaultValue="available"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
              <option value="available">Available</option>
              <option value="checked_out">Checked Out</option>
              <option value="repair">Repair</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Location</label>
            <select name="locationId" defaultValue=""
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
              <option value="">No location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Identification</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Serial Number</label>
            <input name="serialNumber" placeholder="—"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Model Number</label>
            <input name="modelNumber" placeholder="—"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Purchase</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Supplier</label>
            <input name="supplier" placeholder="—"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Purchase Date</label>
            <input name="purchaseDate" type="date"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Value (£)</label>
            <input name="value" type="number" min="0" step="0.01" placeholder="—"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit"
          className="rounded-xl bg-white px-6 py-2 text-black font-medium hover:bg-zinc-200">
          Add Asset
        </button>
        <button type="button" onClick={() => router.push('/assets')}
          className="rounded-xl bg-zinc-800 px-6 py-2 text-white hover:bg-zinc-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
