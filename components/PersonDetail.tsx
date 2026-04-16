'use client'

import { useActionState, useTransition, useState } from 'react'
import { assignAssetToPerson, unassignAsset, updatePerson } from '../app/actions'
import Link from 'next/link'

type Asset = {
  id: number
  name: string
  assetTag: string
  status: string
  location: { name: string } | null
}

type Person = {
  id: number
  name: string
  email: string | null
  department: string | null
  assets: Asset[]
}

type UnassignedAsset = { id: number; name: string; assetTag: string }

export default function PersonDetail({
  person,
  unassignedAssets,
  canEdit,
}: {
  person: Person
  unassignedAssets: UnassignedAsset[]
  canEdit: boolean
}) {
  const [assignState, assignAction] = useActionState(assignAssetToPerson, null)
  const [updateState, updateAction] = useActionState(updatePerson, null)
  const [editing, setEditing] = useState(false)
  const [, startTransition] = useTransition()

  function handleUnassign(assetId: number) {
    startTransition(async () => { await unassignAsset(assetId, person.id) })
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Edit details */}
      {canEdit && (
        <div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-zinc-700">
              Edit details
            </button>
          ) : (
            <form action={updateAction} onSubmit={() => setEditing(false)}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <input type="hidden" name="id" value={person.id} />
              <div className="flex flex-wrap gap-2">
                <input name="name" defaultValue={person.name} placeholder="Full name" required
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-44" />
                <input name="department" defaultValue={person.department ?? ''} placeholder="Department"
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-40" />
                <input name="email" type="email" defaultValue={person.email ?? ''} placeholder="Email"
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-52" />
                <button type="submit"
                  className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-white text-sm hover:bg-zinc-700">
                  Cancel
                </button>
              </div>
              {updateState?.error && <p className="text-red-400 text-sm">{updateState.error}</p>}
            </form>
          )}
        </div>
      )}

      {/* Assigned assets */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Assigned Assets</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {person.assets.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">No assets assigned.</p>
          ) : (
            person.assets.map(asset => (
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
                  {canEdit && (
                    <button type="button" onClick={() => handleUnassign(asset.id)}
                      className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">
                      Unassign
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign asset */}
      {canEdit && unassignedAssets.length > 0 && (
        <form action={assignAction} className="flex gap-2">
          <input type="hidden" name="personId" value={person.id} />
          <select name="assetId" defaultValue=""
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-2 text-white border border-zinc-700 text-sm focus:outline-none focus:border-zinc-500">
            <option value="">Select an asset to assign…</option>
            {unassignedAssets.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
            ))}
          </select>
          <button type="submit"
            className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
            Assign
          </button>
          {assignState?.error && <p className="text-red-400 text-sm">{assignState.error}</p>}
        </form>
      )}
    </div>
  )
}
