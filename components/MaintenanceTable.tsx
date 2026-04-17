'use client'

import React, { useActionState, useTransition, useState } from 'react'
import { createMaintenance, updateMaintenance, deleteMaintenance, deleteMaintenanceSeries } from '../app/actions'
import DatePicker from './DatePicker'
import Link from 'next/link'
import { SortIcon, sortRows, thCls, type SortDir } from './SortableHeader'

type Asset = { id: number; name: string; assetTag: string }

type MaintenanceRecord = {
  id: number
  title: string
  description: string | null
  status: string
  scheduledDate: Date | null
  completedDate: Date | null
  cost: number | null
  repeatIntervalDays: number | null
  repeatEndDate: Date | null
  parentId: number | null
  asset: Asset
}

const STATUS_OPTIONS = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

const STATUS_STYLE: Record<string, string> = {
  PENDING:     'bg-orange-950 text-orange-300',
  SCHEDULED:   'bg-blue-950 text-blue-300',
  IN_PROGRESS: 'bg-yellow-950 text-yellow-300',
  COMPLETED:   'bg-green-950 text-green-300',
  CANCELLED:   'bg-zinc-800 text-zinc-400',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:     'Pending',
  SCHEDULED:   'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
}

const REPEAT_OPTIONS = [
  { label: 'No repeat',      value: '' },
  { label: 'Daily',          value: '1' },
  { label: 'Weekly',         value: '7' },
  { label: 'Monthly',        value: '30' },
  { label: 'Quarterly',      value: '91' },
  { label: 'Every 6 months', value: '182' },
  { label: 'Annually',       value: '365' },
]

function repeatLabel(days: number | null) {
  if (days === null || days === undefined) return null
  const opt = REPEAT_OPTIONS.find(o => o.value === String(days))
  return opt ? opt.label : `Every ${days}d`
}

function fmt(date: Date | null) {
  return date ? new Date(date).toLocaleDateString('en-GB') : '—'
}

// Group flat list into standalone records + series (keyed by root id)
function groupRecords(records: MaintenanceRecord[]) {
  const byId = new Map(records.map(r => [r.id, r]))

  // Find root id for any record
  function rootId(r: MaintenanceRecord): number {
    let cur = r
    while (cur.parentId !== null) {
      const parent = byId.get(cur.parentId)
      if (!parent) break
      cur = parent
    }
    return cur.id
  }

  const seriesMap = new Map<number, MaintenanceRecord[]>()
  const standalone: MaintenanceRecord[] = []

  for (const r of records) {
    if (r.repeatIntervalDays === null && r.parentId === null) {
      standalone.push(r)
    } else {
      const rid = rootId(r)
      if (!seriesMap.has(rid)) seriesMap.set(rid, [])
      seriesMap.get(rid)!.push(r)
    }
  }

  // Sort each series by scheduledDate asc
  for (const [, members] of seriesMap) {
    members.sort((a, b) => {
      const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0
      const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0
      return da - db
    })
  }

  return { standalone, seriesMap }
}

export default function MaintenanceTable({
  records,
  assets,
  canEdit,
}: {
  records: MaintenanceRecord[]
  assets: Asset[]
  canEdit: boolean
}) {
  const [createState, createAction] = useActionState(createMaintenance, null)
  const [updateState, updateAction] = useActionState(updateMaintenance, null)
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<MaintenanceRecord & { assetId: number }>>({})
  const [showForm, setShowForm] = useState(false)
  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set())
  const [deleteSeriesPrompt, setDeleteSeriesPrompt] = useState<MaintenanceRecord[] | null>(null)
  const [sortKey, setSortKey] = useState('scheduledDate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleFilter(s: string) {
    setFilters(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function toggleSeries(rootId: number) {
    setExpandedSeries(prev => {
      const next = new Set(prev)
      next.has(rootId) ? next.delete(rootId) : next.add(rootId)
      return next
    })
  }

  function matchesSearch(r: MaintenanceRecord) {
    if (!search) return true
    const q = search.toLowerCase()
    return r.title.toLowerCase().includes(q) ||
      r.asset.name.toLowerCase().includes(q) ||
      r.asset.assetTag.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q)
  }

  function matchesFilter(r: MaintenanceRecord) {
    return (filters.size === 0 || filters.has(r.status)) && matchesSearch(r)
  }

  function startEdit(r: MaintenanceRecord) {
    setEditingId(r.id)
    setEditValues({
      title: r.title,
      description: r.description ?? undefined,
      status: r.status,
      scheduledDate: r.scheduledDate,
      completedDate: r.completedDate,
      cost: r.cost ?? undefined,
      repeatIntervalDays: r.repeatIntervalDays,
      repeatEndDate: r.repeatEndDate,
    })
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this maintenance record?')) return
    const formData = new FormData()
    formData.append('id', String(id))
    startTransition(async () => { await deleteMaintenance(null, formData) })
  }

  function handleDeleteSeries(members: MaintenanceRecord[]) {
    setDeleteSeriesPrompt(members)
  }

  function confirmDeleteSeries(mode: 'all' | 'future') {
    if (!deleteSeriesPrompt) return
    const toDelete = mode === 'all'
      ? deleteSeriesPrompt
      : deleteSeriesPrompt.filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
    const toKeep = mode === 'future'
      ? deleteSeriesPrompt.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED')
      : []
    setDeleteSeriesPrompt(null)
    if (toDelete.length === 0) return
    const formData = new FormData()
    formData.append('ids', toDelete.map(m => m.id).join(','))
    formData.append('keepIds', toKeep.map(m => m.id).join(','))
    startTransition(async () => { await deleteMaintenanceSeries(null, formData) })
  }

  function completeToday(id: number) {
    const today = new Date().toISOString().split('T')[0]
    const r = records.find(r => r.id === id)!
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('title', r.title)
    formData.append('description', r.description ?? '')
    formData.append('status', 'COMPLETED')
    formData.append('scheduledDate', r.scheduledDate ? new Date(r.scheduledDate).toISOString().split('T')[0] : '')
    formData.append('completedDate', today)
    formData.append('cost', r.cost != null ? String(r.cost) : '')
    formData.append('repeatIntervalDays', r.repeatIntervalDays != null ? String(r.repeatIntervalDays) : '')
    startTransition(async () => { await updateMaintenance(null, formData) })
  }

  function saveEdit(id: number) {
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('title', editValues.title ?? '')
    formData.append('description', editValues.description ?? '')
    formData.append('status', editValues.status ?? 'SCHEDULED')
    formData.append('scheduledDate', editValues.scheduledDate ? new Date(editValues.scheduledDate).toISOString().split('T')[0] : '')
    formData.append('completedDate', editValues.completedDate ? new Date(editValues.completedDate).toISOString().split('T')[0] : '')
    formData.append('cost', editValues.cost != null ? String(editValues.cost) : '')
    formData.append('repeatIntervalDays', editValues.repeatIntervalDays != null ? String(editValues.repeatIntervalDays) : '')
    formData.append('repeatEndDate', editValues.repeatEndDate ? new Date(editValues.repeatEndDate).toISOString().split('T')[0] : '')
    startTransition(async () => {
      await updateMaintenance(null, formData)
      setEditingId(null)
    })
  }

  const inputCls = "rounded-lg bg-zinc-800 px-2 py-1 text-white text-xs border border-zinc-700 focus:outline-none"

  const { standalone, seriesMap } = groupRecords(records)

  // Filter + sort standalone
  const filteredStandalone = sortRows(
    standalone.filter(matchesFilter).map(r => ({
      ...r,
      assetName: r.asset.name,
      scheduledDateVal: r.scheduledDate ? new Date(r.scheduledDate).getTime() : 0,
      completedDateVal: r.completedDate ? new Date(r.completedDate).getTime() : 0,
    })),
    sortKey === 'scheduledDate' ? 'scheduledDateVal'
      : sortKey === 'completedDate' ? 'completedDateVal'
      : sortKey === 'asset' ? 'assetName'
      : sortKey,
    sortDir
  )

  // Filter series — include series if any member matches filter
  const filteredSeries = [...seriesMap.entries()].filter(([, members]) =>
    filters.size === 0 || members.some(m => filters.has(m.status))
  )

  const totalVisible = filteredStandalone.length + filteredSeries.length

  function RecordRow({ r, indent = false }: { r: MaintenanceRecord; indent?: boolean }) {
    const colSpan = canEdit ? 7 : 6
    return editingId === r.id ? (
      <tr className="border-b border-zinc-800 bg-zinc-800/20">
        <td className="p-2 text-zinc-400 text-xs">{r.asset.name}</td>
        <td className="p-2">
          <input value={editValues.title ?? ''} onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))}
            className={inputCls + ' w-40'} />
        </td>
        <td className="p-2">
          <select value={editValues.status ?? 'SCHEDULED'} onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}
            className={inputCls}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </td>
        <td className="p-2">
          <DatePicker
            value={editValues.scheduledDate ? new Date(editValues.scheduledDate).toISOString().split('T')[0] : ''}
            onChange={v => setEditValues(p => ({ ...p, scheduledDate: v ? new Date(v) : null }))} />
        </td>
        <td className="p-2">
          <DatePicker
            value={editValues.completedDate ? new Date(editValues.completedDate).toISOString().split('T')[0] : ''}
            onChange={v => setEditValues(p => ({
              ...p,
              completedDate: v ? new Date(v) : null,
              status: v ? 'COMPLETED' : p.status,
            }))} />
        </td>
        <td className="p-2">
          <input type="number" min="0" step="0.01" value={editValues.cost ?? ''}
            onChange={e => setEditValues(v => ({ ...v, cost: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className={inputCls + ' w-24'} />
        </td>
        <td className="p-2">
          <div className="flex flex-col gap-1">
            <select value={editValues.repeatIntervalDays != null ? String(editValues.repeatIntervalDays) : ''}
              onChange={e => setEditValues(v => ({ ...v, repeatIntervalDays: e.target.value ? parseInt(e.target.value) : null }))}
              className={inputCls}>
              {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <DatePicker
              value={editValues.repeatEndDate ? new Date(editValues.repeatEndDate).toISOString().split('T')[0] : ''}
              onChange={v => setEditValues(p => ({ ...p, repeatEndDate: v ? new Date(v) : null }))}
              placeholder="End date"
              className="mt-1" />
            <div className="flex gap-1 mt-1">
              <button type="button" onClick={() => saveEdit(r.id)}
                className="rounded-lg bg-white px-2 py-1 text-black text-xs font-medium">Save</button>
              <button type="button" onClick={() => setEditingId(null)}
                className="rounded-lg bg-zinc-700 px-2 py-1 text-white text-xs">Cancel</button>
            </div>
          </div>
        </td>
      </tr>
    ) : (
      <tr className={`border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 ${indent ? 'bg-zinc-900/60' : ''}`}>
        <td className={`p-4 ${indent ? 'pl-8' : ''}`}>
          <Link href={`/assets/${r.asset.id}`} className="hover:underline text-zinc-300">
            {r.asset.name}
          </Link>
          <p className="text-xs text-zinc-500">{r.asset.assetTag}</p>
        </td>
        <td className="p-4">
          <span className="font-medium">{r.title}</span>
          {r.description && <p className="text-xs text-zinc-500 mt-0.5">{r.description}</p>}
        </td>
        <td className="p-4">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </span>
        </td>
        <td className="p-4 text-zinc-400">{fmt(r.scheduledDate)}</td>
        <td className="p-4 text-zinc-400">{fmt(r.completedDate)}</td>
        <td className="p-4 text-zinc-400">{r.cost != null ? `£${r.cost.toFixed(2)}` : '—'}</td>
        {canEdit && (
          <td className="p-4">
            <div className="flex gap-1">
              <button type="button" onClick={() => startEdit(r)}
                className="rounded-lg bg-zinc-700 px-2 py-1 text-white text-xs hover:bg-zinc-600">Edit</button>
              {r.status !== 'COMPLETED' && (
                <button type="button" onClick={() => completeToday(r.id)}
                  className="rounded-lg bg-green-900 px-2 py-1 text-green-300 text-xs hover:bg-green-800">Complete today</button>
              )}
              <button type="button" onClick={() => handleDelete(r.id)}
                className="rounded-lg bg-zinc-800 px-2 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">Delete</button>
            </div>
          </td>
        )}
      </tr>
    )
  }

  return (
    <div className="space-y-4">

      {/* Delete series modal */}
      {deleteSeriesPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 w-80 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-white">Delete series</h3>
            <p className="text-sm text-zinc-400">
              This series has <span className="text-white font-medium">{deleteSeriesPrompt.length}</span> occurrences
              ({deleteSeriesPrompt.filter(m => m.status === 'COMPLETED').length} completed,{' '}
              {deleteSeriesPrompt.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS').length} upcoming).
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmDeleteSeries('future')}
                className="rounded-xl bg-zinc-700 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-600 text-left">
                Delete upcoming only
                <p className="text-xs text-zinc-400 font-normal mt-0.5">Keep completed history, remove scheduled events</p>
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteSeries('all')}
                className="rounded-xl bg-red-950 border border-red-800 px-4 py-2 text-red-300 text-sm font-medium hover:bg-red-900 text-left">
                Delete entire series
                <p className="text-xs text-red-400 font-normal mt-0.5">Remove all occurrences including history</p>
              </button>
              <button
                type="button"
                onClick={() => setDeleteSeriesPrompt(null)}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-zinc-400 text-sm hover:bg-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <input type="search" placeholder="Search maintenance records…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button key={s} type="button" onClick={() => toggleFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.has(s) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
        {filters.size > 0 && (
          <button type="button" onClick={() => setFilters(new Set())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-zinc-300 hover:text-white transition-colors">
            Clear
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={() => setShowForm(f => !f)}
            className="ml-auto px-4 py-1.5 rounded-lg text-xs font-medium bg-white text-black hover:bg-zinc-200">
            {showForm ? 'Cancel' : '+ New Record'}
          </button>
        )}
      </div>

      {/* New record form */}
      {canEdit && showForm && (
        <form action={async (fd) => { await createAction(fd); setShowForm(false) }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">New Maintenance Record</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-zinc-500 mb-1 block">Asset *</label>
              <select name="assetId" required
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500">
                <option value="">Select asset…</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="text-xs text-zinc-500 mb-1 block">Title *</label>
              <input name="title" placeholder="e.g. Annual service" required
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Status</label>
              <select name="status" defaultValue="SCHEDULED"
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500">
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Scheduled date</label>
              <DatePicker name="scheduledDate" className="w-full" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Cost (£)</label>
              <input name="cost" type="number" min="0" step="0.01" placeholder="0.00"
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Repeat</label>
              <select name="repeatIntervalDays" defaultValue=""
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500">
                {REPEAT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Repeat end date</label>
              <DatePicker name="repeatEndDate" className="w-full" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="text-xs text-zinc-500 mb-1 block">Description</label>
              <input name="description" placeholder="Optional details"
                className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
              Create
            </button>
          </div>
          {createState?.error && <p className="text-red-400 text-sm">{createState.error}</p>}
        </form>
      )}

      {updateState?.error && <p className="text-red-400 text-sm">{updateState.error}</p>}

      {/* Records table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {totalVisible === 0 ? (
          <p className="p-6 text-zinc-400">No records{filters.size > 0 ? ' with the selected status' : ''}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className={thCls} onClick={() => toggleSort('asset')}>Asset <SortIcon active={sortKey==='asset'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('title')}>Title <SortIcon active={sortKey==='title'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('status')}>Status <SortIcon active={sortKey==='status'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('scheduledDate')}>Scheduled <SortIcon active={sortKey==='scheduledDate'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('completedDate')}>Completed <SortIcon active={sortKey==='completedDate'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('cost')}>Cost <SortIcon active={sortKey==='cost'} dir={sortDir} /></th>
                {canEdit && <th className="p-4 text-left"></th>}
              </tr>
            </thead>
            <tbody>
              {/* Standalone records */}
              {filteredStandalone.map(r => (
                <RecordRow key={r.id} r={r} />
              ))}

              {/* Series groups */}
              {filteredSeries.map(([rootId, members]) => {
                const root = members[0]
                const expanded = expandedSeries.has(rootId)
                const visibleMembers = filters.size === 0 ? members : members.filter(m => filters.has(m.status))
                const completedCount = members.filter(m => m.status === 'COMPLETED').length
                const nextPending = members.find(m => m.status === 'PENDING' || m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')

                return (
                  <React.Fragment key={`series-${rootId}`}>
                    {/* Series header row */}
                    <tr
                      className="border-b border-zinc-800 bg-purple-950/20 hover:bg-purple-950/30 cursor-pointer select-none"
                      onClick={() => toggleSeries(rootId)}
                    >
                      <td className="p-4">
                        <Link
                          href={`/assets/${root.asset.id}`}
                          className="hover:underline text-zinc-300"
                          onClick={e => e.stopPropagation()}
                        >
                          {root.asset.name}
                        </Link>
                        <p className="text-xs text-zinc-500">{root.asset.assetTag}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 text-sm">{expanded ? '▾' : '▸'}</span>
                          <div>
                            <span className="font-medium">{root.title}</span>
                            <p className="text-xs text-purple-400 mt-0.5">
                              ↻ {repeatLabel(root.repeatIntervalDays)} · {members.length} occurrences
                              {root.repeatEndDate && ` · ends ${fmt(root.repeatEndDate)}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {nextPending ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[nextPending.status]}`}>
                            {STATUS_LABEL[nextPending.status]}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-950 text-green-300">All done</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-400">
                        {nextPending ? fmt(nextPending.scheduledDate) : '—'}
                      </td>
                      <td className="p-4 text-zinc-400 text-xs">{completedCount}/{members.length} completed</td>
                      <td className="p-4 text-zinc-400">
                        {members.reduce((sum, m) => sum + (m.cost ?? 0), 0) > 0
                          ? `£${members.reduce((sum, m) => sum + (m.cost ?? 0), 0).toFixed(2)}`
                          : '—'}
                      </td>
                      {canEdit && (
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDeleteSeries(members)}
                            className="rounded-lg bg-zinc-800 px-2 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">
                            Delete series
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded series rows */}
                    {expanded && visibleMembers.map(r => (
                      <RecordRow key={r.id} r={r} indent />
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
