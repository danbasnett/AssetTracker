'use client'

import { useActionState, useState, useEffect } from 'react'
import { deleteAssets, updateAsset } from '../app/actions'
import BulkEditBar from './BulkEditBar'

type Location = {
  id: number
  name: string
}

type Asset = {
  id: number
  name: string
  assetTag: string
  status: string
  location: { name: string } | null
  locationId?: number | null
}

export default function AssetTable({ assets, locations }: { assets: Asset[], locations: Location[] }) {
  const [deleteState, deleteAction] = useActionState(deleteAssets, null)
  const [selected, setSelected] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Asset>>({})
  const [updateState, updateAction] = useActionState(updateAsset, null)

  function toggle(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleDeleteSubmit(e: React.FormEvent) {
    if (selected.length === 0) {
      e.preventDefault()
      return
    }
    if (!confirm(`Delete ${selected.length} asset(s)? This cannot be undone.`)) {
      e.preventDefault()
      return
    }
    setSelected([])
  }

  function startEdit(asset: Asset) {
    setEditingId(asset.id)
    setEditValues({
      name: asset.name,
      assetTag: asset.assetTag,
      status: asset.status,
      locationId: asset.locationId ?? null
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  useEffect(() => {
    if (updateState?.success) {
      setEditingId(null)
      setEditValues({})
    }
  }, [updateState])

  return (
    <div>
      {/* Delete form */}
      <form action={deleteAction} onSubmit={handleDeleteSubmit}>
        {deleteState?.error && (
          <p className="text-red-400 text-sm mb-3">{deleteState.error}</p>
        )}

        {selected.filter(id => assets.some(a => a.id === id)).length > 0 && (
          <div className="mb-3">
            <button type="submit"
              className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium">
              Delete {selected.filter(id => assets.some(a => a.id === id)).length} selected
            </button>
          </div>
        )}

	<BulkEditBar
	  selectedIds={selected}
	  locations={locations}
	  onSuccess={() => setSelected([])}
	/>

        {selected.map(id => (
          <input key={id} type="hidden" name="selectedIds" value={id} />
        ))}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
          {assets.length === 0 ? (
            <p className="p-6 text-zinc-400">No assets yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="p-4 text-left w-8"></th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Tag</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b border-zinc-800 last:border-0">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(asset.id)}
                        onChange={() => toggle(asset.id)}
                        className="w-4 h-4 accent-white align-middle"
                      />
                    </td>

                    {editingId === asset.id ? (
                      <>
                        <td className="p-2">
                          <input
                            value={editValues.name ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            value={editValues.assetTag ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, assetTag: e.target.value }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={editValues.status ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700">
                            <option value="available">Available</option>
                            <option value="checked_out">Checked Out</option>
                            <option value="repair">Repair</option>
                            <option value="retired">Retired</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={editValues.locationId ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, locationId: e.target.value ? parseInt(e.target.value) : null }))}
                            className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700">
                            <option value="">No location</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <form action={updateAction}>
                            <input type="hidden" name="id" value={asset.id} />
                            <input type="hidden" name="name" value={editValues.name ?? ''} />
                            <input type="hidden" name="assetTag" value={editValues.assetTag ?? ''} />
                            <input type="hidden" name="status" value={editValues.status ?? ''} />
                            <input type="hidden" name="locationId" value={editValues.locationId ?? ''} />
                            <div className="flex gap-2">
                              <button type="submit"
                                className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium">
                                Save
                              </button>
                              <button type="button" onClick={cancelEdit}
                                className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4">{asset.name}</td>
                        <td className="p-4 text-zinc-400">{asset.assetTag}</td>
                        <td className="p-4">{asset.status}</td>
                        <td className="p-4 text-zinc-400">{asset.location?.name ?? '—'}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => startEdit(asset)}
                            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
                            Edit
                          </button>
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
