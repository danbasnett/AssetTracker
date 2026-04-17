'use client'

import { useState, useTransition, useActionState, useEffect, useRef } from 'react'
import { updateAsset, reportProblem } from '../app/actions'
import DatePicker from './DatePicker'

type Location = { id: number; name: string }
type Status = { id: number; name: string }

type Template = { id: number; name: string; type: string; modelNumber: string | null }

type Asset = {
  id: number
  name: string
  assetTag: string
  type: string
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

export default function AssetDetailEditor({ asset, locations, statuses, templates, canEdit }: { asset: Asset; locations: Location[]; statuses: Status[]; templates: Template[]; canEdit: boolean }) {
  const [editing, setEditing] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportState, reportAction] = useActionState(reportProblem, null)
  const [typeQuery, setTypeQuery] = useState(asset.type)
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false)
  const typeContainerRef = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState({
    name: asset.name,
    assetTag: asset.assetTag,
    type: asset.type,
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

  const typeSuggestions = templates.filter(t =>
    typeQuery && t.name.toLowerCase().includes(typeQuery.toLowerCase())
  ).slice(0, 6)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeContainerRef.current && !typeContainerRef.current.contains(e.target as Node)) setShowTypeSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function save() {
    const formData = new FormData()
    formData.append('id', String(asset.id))
    formData.append('name', values.name)
    formData.append('assetTag', values.assetTag)
    formData.append('type', values.type)
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
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => { setShowReportForm(f => !f); setEditing(false) }}
            className="rounded-lg bg-red-950 border border-red-800 px-3 py-1 text-red-300 text-xs font-medium hover:bg-red-900 transition-colors">
            {showReportForm ? 'Cancel' : '⚠ Report Problem'}
          </button>
          {!editing ? (
            canEdit && (
              <button onClick={() => { setEditing(true); setShowReportForm(false) }}
                className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
                Edit
              </button>
            )
          ) : (
            <>
              <button onClick={save} disabled={isPending}
                className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">
                Save
              </button>
              <button onClick={() => { setEditing(false); setError(null) }}
                className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {showReportForm && (
        <form
          action={async (fd) => { await reportAction(fd); setShowReportForm(false) }}
          className="rounded-2xl border border-red-900 bg-red-950/30 p-4 space-y-3 mb-4">
          <input type="hidden" name="assetId" value={asset.id} />
          <label className="text-xs text-zinc-400 block">Describe the problem (optional)</label>
          <input
            name="description"
            placeholder="e.g. Screen cracked, won't power on…"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
          <button type="submit"
            className="rounded-xl bg-red-800 px-4 py-2 text-white text-sm font-medium hover:bg-red-700">
            Submit Report
          </button>
          {(reportState as any)?.error && <p className="text-red-400 text-sm">{(reportState as any).error}</p>}
        </form>
      )}

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
          <span className="text-zinc-400">Type</span>
          {editing ? (
            <div ref={typeContainerRef} className="relative">
              <input value={typeQuery}
                onChange={e => { setTypeQuery(e.target.value); setValues(v => ({ ...v, type: e.target.value })); setShowTypeSuggestions(true) }}
                onFocus={() => setShowTypeSuggestions(true)}
                placeholder="required"
                className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 text-sm w-48" />
              {showTypeSuggestions && typeSuggestions.length > 0 && (
                <div className="absolute top-full mt-1 right-0 z-30 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                  {typeSuggestions.map(t => (
                    <button key={t.id} type="button"
                      onMouseDown={e => { e.preventDefault(); setTypeQuery(t.name); setValues(v => ({ ...v, type: t.name })); setShowTypeSuggestions(false) }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800">
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : <span className={asset.type ? '' : 'text-zinc-500 italic'}>{asset.type || 'Not set'}</span>}
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
            <DatePicker value={values.purchaseDate} onChange={v => setValues(p => ({ ...p, purchaseDate: v }))}
              className="w-44" />
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
              {statuses.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          ) : <span>{asset.status}</span>}
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
