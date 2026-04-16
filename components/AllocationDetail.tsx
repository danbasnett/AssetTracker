'use client'

import { useActionState, useTransition } from 'react'
import { addAssetToAllocation, removeAssetFromAllocation } from '../app/actions'
import Link from 'next/link'

type AllocatedAsset = {
  id: number
  name: string
  assetTag: string
  status: string
  location: { name: string } | null
}

type Allocation = {
  id: number
  assets: AllocatedAsset[]
}

type Asset = {
  id: number
  name: string
  assetTag: string
}

export default function AllocationDetail({ allocation, allAssets, canManage }: { allocation: Allocation; allAssets: Asset[]; canManage: boolean }) {
  const allocatedIds = new Set(allocation.assets.map(a => a.id))
  const available = allAssets.filter(a => !allocatedIds.has(a.id))

  const [addState, addAction] = useActionState(addAssetToAllocation, null)
  const [, startTransition] = useTransition()

  function handleRemove(assetId: number) {
    startTransition(async () => {
      await removeAssetFromAllocation(allocation.id, assetId)
    })
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Assets</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {allocation.assets.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">No assets in this allocation yet.</p>
          ) : (
            allocation.assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="min-w-0">
                  <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                    {asset.name}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {asset.assetTag}
                    {asset.location && ` · ${asset.location.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-400">{asset.status}</span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRemove(asset.id)}
                      className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {canManage && available.length > 0 && (
        <form action={addAction} className="flex gap-2">
          <input type="hidden" name="allocationId" value={allocation.id} />
          <select name="assetId" defaultValue=""
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-2 text-white border border-zinc-700 text-sm focus:outline-none focus:border-zinc-500">
            <option value="">Select an asset to add…</option>
            {available.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
            ))}
          </select>
          <button type="submit"
            className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
            Add
          </button>
        </form>
      )}

      {addState?.error && <p className="text-red-400 text-sm">{addState.error}</p>}
    </div>
  )
}
