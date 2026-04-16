'use client'

import { useState, useTransition } from 'react'
import { deleteAssets, updateAsset } from '../app/actions'
import BulkEditBar from './BulkEditBar'
import SearchBar from './SearchBar'
import Link from 'next/link'

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
  const [selected, setSelected] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Asset>>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetTag.toLowerCase().includes(search.toLowerCase())
  )

  const activeSelected = selected.filter(id => assets.some(a => a.id === id)).length

  function toggle(id: number) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function handleDelete() {
    if (activeSelected === 0) return
    if (!confirm(`Delete ${activeSelected} asset(s)? This cannot be undone.`)) return

    const formData = new FormData()
    selected.filter(id => assets.some(a => a.id === id)).forEach(id => {
      formData.append('selectedIds', String(id))
    })

    startTransition(async () => {
      const result = await deleteAssets(null, formData)
      if (result?.error) {
        setDeleteError(result.error)
      } else {
        setSelected([])
        setDeleteError(null)
      }
    })
  }

  function startEdit(asset: Asset) {
    setEditingId(asset.id)
    setEditError(null)
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
    setEditError(null)
  }

  function saveEdit(id: number) {
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('name', editValues.name ?? '')
    formData.append('assetTag', editValues.assetTag ?? '')
    formData.append('status', editValues.status ?? '')
    formData.append('locationId', editValues.locationId ? String(editValues.locationId) : '')

    startTransition(async () => {
      const result = await updateAsset(null, formData)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setEditingId(null)
        setEditValues({})
        setEditError(null)
      }
    })
  }

  return (
    <div>
      {(deleteError || editError) && (
        <p className="text-red-400 text-sm mb-3">{deleteError || editError}</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} />
        {activeSelected > 0 && (
          <>
            <button type="button" onClick={handleDelete} disabled={isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium disabled:opacity-50">
              Delete {activeSelected}
            </button>
            <button type="button" onClick={() => setSelected([])}
              className="rounded-xl bg-zinc-700 px-4 py-2 text-white font-medium hover:bg-zinc-600">
              Deselect all
            </button>
          </>
        )}
        <BulkEditBar
          selectedIds={selected}
          locations={locations}
          onSuccess={() => setSelected([])}
        />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-zinc-400">{search ? 'No assets match your search.' : 'No assets yet.'}</p>
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
              {filtered.map(asset => (
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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(asset.id)}
                            disabled={isPending}
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
                        <Link href={`/assets/${asset.id}`} className="hover:underline">
                          {asset.name}
                        </Link>
                      </td>
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
    </div>
  )
}
