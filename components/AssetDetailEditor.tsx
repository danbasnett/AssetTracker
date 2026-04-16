'use client'

import { useState, useTransition } from 'react'
import { updateAsset } from '../app/actions'

type Location = { id: number; name: string }

type Asset = {
  id: number
  name: string
  assetTag: string
  status: string
  locationId: number | null
  location: { name: string } | null
  serialNumber: string | null
  modelNumber: string | null
  supplier: string | null
  purchaseDate: Date | null
  value: number | null
  createdAt: Date
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  checked_out: 'Checked Out',
  repair: 'Repair',
  retired: 'Retired',
}

export default function AssetDetailEditor({ asset, locations }: { asset: Asset; locations: Location[] }) {
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({
    name: asset.name,
    assetTag: asset.assetTag,
    status: asset.status,
    locationId: asset.locationId ? String(asset.locationId) : '',
    serialNumber: asset.serialNumber ?? '',
    modelNumber: asset.modelNumber ?? '',
    supplier: asset.supplier ?? '',
    purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
    value: asset.value != null ? String(asset.value) : '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    const formData = new FormData()
    formData.append('id', String(asset.id))
    formData.append('name', values.name)
    formData.append('assetTag', values.assetTag)
    formData.append('status', values.status)
    formData.append('locationId', values.locationId)
    formData.append('serialNumber', values.serialNumber)
    formData.append('modelNumber', values.modelNumber)
    formData.append('supplier', values.supplier)
    formData.append('purchaseDate', values.purchaseDate)
    formData.append('value', values.value)

    startTransition(async () => {
      const result = await updateAsset(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditing(false)
        setError(null)
      }
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
            <button onClick={() => { setEditing(false); setError(null) }}
              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Name</span>
          {editing ? (
            <input value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{asset.name}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Asset Tag</span>
          {editing ? (
            <input value={values.assetTag} onChange={e => setValues(v => ({ ...v, assetTag: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{asset.assetTag}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Serial Number</span>
          {editing ? (
            <input value={values.serialNumber} onChange={e => setValues(v => ({ ...v, serialNumber: e.target.value }))}
              placeholder="—"
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{asset.serialNumber ?? '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Model Number</span>
          {editing ? (
            <input value={values.modelNumber} onChange={e => setValues(v => ({ ...v, modelNumber: e.target.value }))}
              placeholder="—"
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{asset.modelNumber ?? '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Supplier</span>
          {editing ? (
            <input value={values.supplier} onChange={e => setValues(v => ({ ...v, supplier: e.target.value }))}
              placeholder="—"
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
          ) : <span>{asset.supplier ?? '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Purchase Date</span>
          {editing ? (
            <input type="date" value={values.purchaseDate} onChange={e => setValues(v => ({ ...v, purchaseDate: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm" />
          ) : <span>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('en-GB') : '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Value</span>
          {editing ? (
            <input type="number" min="0" step="0.01" value={values.value} onChange={e => setValues(v => ({ ...v, value: e.target.value }))}
              placeholder="—"
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-32" />
          ) : <span>{asset.value != null ? `£${asset.value.toFixed(2)}` : '—'}</span>}
        </div>
        <div className="flex justify-between items-center px-6 py-4">
          <span className="text-zinc-400">Status</span>
          {editing ? (
            <select value={values.status} onChange={e => setValues(v => ({ ...v, status: e.target.value }))}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm">
              {Object.entries(statusLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          ) : <span>{statusLabels[asset.status] ?? asset.status}</span>}
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
          ) : <span>{asset.location?.name ?? '—'}</span>}
        </div>
        <div className="flex justify-between px-6 py-4">
          <span className="text-zinc-400">Added</span>
          <span>{new Date(asset.createdAt).toLocaleDateString('en-GB')}</span>
        </div>
      </div>
    </div>
  )
}
