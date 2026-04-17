'use client'

import { useState, useTransition, useRef } from 'react'
import { deleteAssets, updateAsset, setAssetTags } from '../app/actions'
import BulkEditBar from './BulkEditBar'
import SearchBar from './SearchBar'
import Link from 'next/link'
import { SortIcon, sortRows, thCls, type SortDir } from './SortableHeader'
import TagSelector from './TagSelector'

type Location = { id: number; name: string }
type Status = { id: number; name: string }
type Template = { id: number; name: string; type: string }
type TagDef = { id: number; name: string; color: string }

type Asset = {
  id: number
  name: string
  assetTag: string
  type?: string
  status: string
  location: { name: string } | null
  locationId?: number | null
  tags?: { tag: TagDef }[]
}

export default function AssetTable({ assets, locations, statuses, templates = [], allTags = [], canEdit, canAdmin = false }: {
  assets: Asset[]
  locations: Location[]
  statuses: Status[]
  templates?: Template[]
  allTags?: TagDef[]
  canEdit: boolean
  canAdmin?: boolean
}) {
  const [selected, setSelected] = useState<number[]>([])
  const lastClickedIndex = useRef<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Asset & { type: string }>>({})
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [tagFilters, setTagFilters] = useState<Set<number>>(new Set())
  const [editTags, setEditTags] = useState<Set<number>>(new Set())

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleStatusFilter(s: string) {
    setStatusFilters(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

const filtered = sortRows(
    assets.filter(a =>
      (a.name.toLowerCase().includes(search.toLowerCase()) ||
       a.assetTag.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilters.size === 0 || statusFilters.has(a.status)) &&
      (tagFilters.size === 0 || (a.tags ?? []).some(t => tagFilters.has(t.tag.id)))
    ).map(a => ({ ...a, locationName: a.location?.name ?? '' })),
    sortKey, sortDir
  )

  const activeSelected = selected.filter(id => assets.some(a => a.id === id)).length

  function toggle(id: number, index: number, shiftKey: boolean) {
    if (shiftKey && lastClickedIndex.current !== null) {
      const lo = Math.min(lastClickedIndex.current, index)
      const hi = Math.max(lastClickedIndex.current, index)
      const rangeIds = filtered.slice(lo, hi + 1).map(a => a.id)
      const adding = !selected.includes(id)
      setSelected(prev => {
        const set = new Set(prev)
        rangeIds.forEach(rid => adding ? set.add(rid) : set.delete(rid))
        return [...set]
      })
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
    lastClickedIndex.current = index
  }

  function handleDelete() {
    if (activeSelected === 0) return
    if (!confirm(`Delete ${activeSelected} asset(s)? This cannot be undone.`)) return
    const formData = new FormData()
    selected.filter(id => assets.some(a => a.id === id)).forEach(id => formData.append('selectedIds', String(id)))
    startTransition(async () => {
      const result = await deleteAssets(null, formData)
      if (result?.error) { setDeleteError(result.error) }
      else { setSelected([]); setDeleteError(null) }
    })
  }

  function startEdit(asset: Asset) {
    setEditingId(asset.id)
    setEditError(null)
    setEditValues({
      name: asset.name,
      assetTag: asset.assetTag,
      type: asset.type ?? '',
      status: asset.status,
      locationId: asset.locationId ?? null,
    })
    setEditTags(new Set((asset.tags ?? []).map(t => t.tag.id)))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
    setEditError(null)
    setEditTags(new Set())
  }

  function saveEdit(id: number) {
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('name', editValues.name ?? '')
    formData.append('assetTag', editValues.assetTag ?? '')
    formData.append('type', editValues.type ?? '')
    formData.append('status', editValues.status ?? '')
    formData.append('locationId', editValues.locationId ? String(editValues.locationId) : '')
    startTransition(async () => {
      const [result] = await Promise.all([
        updateAsset(null, formData),
        setAssetTags(id, [...editTags]),
      ])
      if (result?.error) { setEditError(result.error) }
      else { setEditingId(null); setEditValues({}); setEditError(null); setEditTags(new Set()) }
    })
  }

  return (
    <div>
      {(deleteError || editError) && (
        <p className="text-red-400 text-sm mb-3">{deleteError || editError}</p>
      )}

      {statuses.length > 0 && (
        <div className="mb-2 flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s.id} type="button" onClick={() => toggleStatusFilter(s.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilters.has(s.name) ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}>
              {s.name}
            </button>
          ))}
          {statusFilters.size > 0 && (
            <button type="button" onClick={() => setStatusFilters(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-zinc-300 hover:text-white transition-colors">
              Clear
            </button>
          )}
        </div>
      )}

      {allTags.length > 0 && (
        <div className="mb-2 flex gap-1 flex-wrap">
          {allTags.map(tag => (
            <button key={tag.id} type="button" onClick={() => setTagFilters(prev => { const n = new Set(prev); n.has(tag.id) ? n.delete(tag.id) : n.add(tag.id); return n })}
              className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
              style={tagFilters.has(tag.id)
                ? { backgroundColor: tag.color, borderColor: tag.color, color: 'white' }
                : { borderColor: tag.color + '60', color: '#a1a1aa', backgroundColor: 'transparent' }
              }>
              {tag.name}
            </button>
          ))}
          {tagFilters.size > 0 && (
            <button type="button" onClick={() => setTagFilters(new Set())}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-700 text-zinc-300 hover:text-white transition-colors border-2 border-transparent">
              Clear
            </button>
          )}
        </div>
      )}


      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} />
        {canEdit && activeSelected > 0 && (
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
        {canEdit && (
          <BulkEditBar
            selectedIds={selected}
            locations={locations}
            statuses={statuses}
            templates={templates}
            onSuccess={() => setSelected([])}
          />
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-zinc-400">{search ? 'No assets match your search.' : 'No assets yet.'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                {canEdit && <th className="p-4 text-left w-8"></th>}
                <th className={thCls} onClick={() => toggleSort('name')}>Name <SortIcon active={sortKey==='name'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('assetTag')}>Tag <SortIcon active={sortKey==='assetTag'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('type')}>Type <SortIcon active={sortKey==='type'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('status')}>Status <SortIcon active={sortKey==='status'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('locationName')}>Location <SortIcon active={sortKey==='locationName'} dir={sortDir} /></th>
                <th className="p-4 text-left text-zinc-400">Tags</th>
                {canEdit && <th className="p-4 text-left"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, index) => (
                <tr key={asset.id} className={`border-b border-zinc-800 last:border-0 ${selected.includes(asset.id) ? 'bg-zinc-800/50' : ''}`}>
                  {canEdit && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(asset.id)}
                        onChange={() => {}}
                        onClick={e => { e.stopPropagation(); toggle(asset.id, index, e.shiftKey) }}
                        className="w-4 h-4 accent-white align-middle cursor-pointer"
                      />
                    </td>
                  )}

                  {canEdit && editingId === asset.id ? (
                    <>
                      <td className="p-2">
                        <input value={editValues.name ?? ''} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                          className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full" />
                      </td>
                      <td className="p-2">
                        <input value={editValues.assetTag ?? ''} onChange={e => setEditValues(v => ({ ...v, assetTag: e.target.value }))}
                          className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full" />
                      </td>
                      <td className="p-2">
                        <input value={editValues.type ?? ''} onChange={e => setEditValues(v => ({ ...v, type: e.target.value }))}
                          placeholder="type"
                          className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full" />
                      </td>
                      <td className="p-2">
                        <select value={editValues.status ?? ''} onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}
                          className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700">
                          {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2">
                        <select value={editValues.locationId ?? ''} onChange={e => setEditValues(v => ({ ...v, locationId: e.target.value ? parseInt(e.target.value) : null }))}
                          className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700">
                          <option value="">No location</option>
                          {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                      </td>
                      <td className="p-2 min-w-[160px]">
                        <TagSelector
                          allTags={allTags}
                          selectedIds={[...editTags]}
                          onChange={ids => setEditTags(new Set(ids))}
                          canCreate={canAdmin}
                          disabled={isPending}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEdit(asset.id)} disabled={isPending}
                            className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">Save</button>
                          <button type="button" onClick={cancelEdit}
                            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <Link href={`/assets/${asset.id}`} className="hover:underline">{asset.name}</Link>
                      </td>
                      <td className="p-4 text-zinc-400">{asset.assetTag}</td>
                      <td className="p-4 text-zinc-400">{asset.type || '—'}</td>
                      <td className="p-4">{asset.status}</td>
                      <td className="p-4 text-zinc-400">{asset.location?.name ?? '—'}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {(asset.tags ?? []).map(({ tag }) => (
                            <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      {canEdit && (
                        <td className="p-4">
                          <button type="button" onClick={() => startEdit(asset)}
                            className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">Edit</button>
                        </td>
                      )}
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
