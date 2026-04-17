'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { deleteAssets, updateAsset, setAssetTags } from '../app/actions'
import BulkEditBar from './BulkEditBar'
import SearchBar from './SearchBar'
import Link from 'next/link'
import { SortIcon, sortRows, thCls, type SortDir } from './SortableHeader'
import TagSelector from './TagSelector'
import { ChevronRight, ChevronDown, Boxes } from 'lucide-react'

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

type KitItem = { asset: Asset }
type Kit = { id: number; name: string; kitCode: string; container: Asset | null; items: KitItem[] }

function TagFilterDropdown({ allTags, selected, onChange }: {
  allTags: TagDef[]
  selected: Set<number>
  onChange: (s: Set<number>) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function down(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  const filtered = allTags.filter(t => !q || t.name.toLowerCase().includes(q.toLowerCase()))
  const count = selected.size

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-medium hover:border-zinc-500 transition-colors">
        <span className="text-zinc-400">Tags</span>
        {count > 0 && (
          <span className="flex gap-1 flex-wrap items-center">
            {[...selected].map(id => {
              const tag = allTags.find(t => t.id === id)
              if (!tag) return null
              return (
                <span key={id} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}>{tag.name}</span>
              )
            })}
            <button type="button" onClick={e => { e.stopPropagation(); onChange(new Set()) }}
              className="ml-1 text-zinc-400 hover:text-white text-xs">✕</button>
          </span>
        )}
        {count === 0 && <span className="text-zinc-600 text-xs">All</span>}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="p-2 border-b border-zinc-800">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search tags…"
              className="w-full bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none" />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map(tag => {
              const on = selected.has(tag.id)
              return (
                <button key={tag.id} type="button"
                  onClick={() => onChange((() => { const n = new Set(selected); n.has(tag.id) ? n.delete(tag.id) : n.add(tag.id); return n })())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 text-left">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className={on ? 'text-white font-medium' : 'text-zinc-300'}>{tag.name}</span>
                  {on && <span className="ml-auto text-zinc-400">✓</span>}
                </button>
              )
            })}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No tags found</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// A row is either a kit header, a kit child asset, or a standalone asset
type Row =
  | { kind: 'kit'; kit: Kit }
  | { kind: 'asset'; asset: Asset & { locationName: string }; inKit: boolean; kitHeader?: Kit }

function buildRows(
  assets: Asset[],
  kits: Kit[],
  search: string,
  statusFilters: Set<string>,
  tagFilters: Set<number>,
  collapsedKits: Set<number>,
  sortKey: string,
  sortDir: SortDir
): Row[] {
  const q = search.toLowerCase()

  function assetMatches(a: Asset) {
    const text = !q || a.name.toLowerCase().includes(q) || a.assetTag.toLowerCase().includes(q)
    const status = statusFilters.size === 0 || statusFilters.has(a.status)
    const tag = tagFilters.size === 0 || (a.tags ?? []).some(t => tagFilters.has(t.tag.id))
    return text && status && tag
  }

  // IDs of assets that are kit contents OR kit containers (hide from standalone list)
  const kitAssetIds = new Set(kits.flatMap(k => [
    ...k.items.map(i => i.asset.id),
    ...(k.container ? [k.container.id] : []),
  ]))

  const rows: Row[] = []

  // Kits + standalone assets sorted together by name
  type Sortable = { sortName: string; emit: () => void }
  const entries: Sortable[] = []

  for (const kit of kits) {
    const kitItems = kit.items.map(i => ({ ...i.asset, locationName: i.asset.location?.name ?? '' }))
    const containerAsset = kit.container ? { ...kit.container, locationName: kit.container.location?.name ?? '' } : null
    const anyMatch = !q && statusFilters.size === 0 && tagFilters.size === 0
      ? true
      : (containerAsset && assetMatches(containerAsset)) || kitItems.some(assetMatches)
    if (!anyMatch) continue
    const headerName = containerAsset ? containerAsset.name.toLowerCase() : kit.name.toLowerCase()
    entries.push({
      sortName: headerName,
      emit: () => {
        // Header row: container asset if present, else generic kit row
        if (containerAsset) {
          rows.push({ kind: 'asset', asset: containerAsset, inKit: false, kitHeader: kit })
        } else {
          rows.push({ kind: 'kit', kit })
        }
        if (!collapsedKits.has(kit.id)) {
          const sorted = sortRows(kitItems, sortKey, sortDir)
          for (const a of sorted) {
            if (q || statusFilters.size > 0 || tagFilters.size > 0) {
              if (!assetMatches(a)) continue
            }
            rows.push({ kind: 'asset', asset: a, inKit: true })
          }
        }
      },
    })
  }

  const standaloneAssets = assets.filter(a => !kitAssetIds.has(a.id))
  const sortedStandalone = sortRows(
    standaloneAssets.map(a => ({ ...a, locationName: a.location?.name ?? '' })),
    sortKey, sortDir
  )
  for (const a of sortedStandalone) {
    if (!assetMatches(a)) continue
    entries.push({
      sortName: a.name.toLowerCase(),
      emit: () => rows.push({ kind: 'asset', asset: a, inKit: false }),
    })
  }

  // Sort entries alphabetically (kits and standalone assets mixed)
  entries.sort((a, b) => a.sortName.localeCompare(b.sortName))
  entries.forEach(e => e.emit())

  return rows
}

const COL_COUNT_EDIT = 8  // checkbox + name + tag + type + status + location + tags + actions
const COL_COUNT_VIEW = 7

export default function AssetTable({ assets, locations, statuses, templates = [], allTags = [], kits = [], canEdit, canAdmin = false }: {
  assets: Asset[]
  locations: Location[]
  statuses: Status[]
  templates?: Template[]
  allTags?: TagDef[]
  kits?: Kit[]
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
  const [collapsedKits, setCollapsedKits] = useState<Set<number>>(new Set())

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleStatusFilter(s: string) {
    setStatusFilters(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  function toggleKitCollapse(id: number) {
    setCollapsedKits(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const rows = buildRows(assets, kits, search, statusFilters, tagFilters, collapsedKits, sortKey, sortDir)

  // Flat index only counts asset rows for shift-click
  const assetRowIndices = rows.reduce<number[]>((acc, r, i) => { if (r.kind === 'asset') acc.push(i); return acc }, [])
  const activeSelected = selected.filter(id => assets.some(a => a.id === id)).length

  function toggle(id: number, rowIndex: number, shiftKey: boolean) {
    if (shiftKey && lastClickedIndex.current !== null) {
      const lo = Math.min(lastClickedIndex.current, rowIndex)
      const hi = Math.max(lastClickedIndex.current, rowIndex)
      const rangeIds = rows.slice(lo, hi + 1).filter(r => r.kind === 'asset').map(r => (r as any).asset.id)
      const adding = !selected.includes(id)
      setSelected(prev => { const s = new Set(prev); rangeIds.forEach(rid => adding ? s.add(rid) : s.delete(rid)); return [...s] })
    } else {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }
    lastClickedIndex.current = rowIndex
  }

  function handleDelete() {
    if (activeSelected === 0) return
    if (!confirm(`Delete ${activeSelected} asset(s)? This cannot be undone.`)) return
    const formData = new FormData()
    selected.filter(id => assets.some(a => a.id === id)).forEach(id => formData.append('selectedIds', String(id)))
    startTransition(async () => {
      const result = await deleteAssets(null, formData)
      if (result?.error) setDeleteError(result.error)
      else { setSelected([]); setDeleteError(null) }
    })
  }

  function startEdit(asset: Asset) {
    setEditingId(asset.id)
    setEditError(null)
    setEditValues({ name: asset.name, assetTag: asset.assetTag, type: asset.type ?? '', status: asset.status, locationId: asset.locationId ?? null })
    setEditTags(new Set((asset.tags ?? []).map(t => t.tag.id)))
  }

  function cancelEdit() { setEditingId(null); setEditValues({}); setEditError(null); setEditTags(new Set()) }

  function saveEdit(id: number) {
    const formData = new FormData()
    formData.append('id', String(id))
    formData.append('name', editValues.name ?? '')
    formData.append('assetTag', editValues.assetTag ?? '')
    formData.append('type', editValues.type ?? '')
    formData.append('status', editValues.status ?? '')
    formData.append('locationId', editValues.locationId ? String(editValues.locationId) : '')
    startTransition(async () => {
      const [result] = await Promise.all([updateAsset(null, formData), setAssetTags(id, [...editTags])])
      if (result?.error) setEditError(result.error)
      else { setEditingId(null); setEditValues({}); setEditError(null); setEditTags(new Set()) }
    })
  }

  const colSpan = canEdit ? COL_COUNT_EDIT : COL_COUNT_VIEW

  return (
    <div>
      {(deleteError || editError) && <p className="text-red-400 text-sm mb-3">{deleteError || editError}</p>}

      {(statuses.length > 0 || allTags.length > 0) && (
        <div className="mb-2 flex gap-1 flex-wrap items-center">
          {statuses.map(s => (
            <button key={s.id} type="button" onClick={() => toggleStatusFilter(s.name)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                statusFilters.has(s.name) ? 'bg-white text-black border-transparent' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
              }`}>
              {s.name}
            </button>
          ))}
          {statusFilters.size > 0 && (
            <button type="button" onClick={() => setStatusFilters(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-zinc-600 bg-zinc-700 text-zinc-300 hover:text-white transition-colors">
              Clear
            </button>
          )}
          {allTags.length > 0 && <TagFilterDropdown allTags={allTags} selected={tagFilters} onChange={setTagFilters} />}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} className="flex-1 min-w-[200px]" />
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
          <BulkEditBar selectedIds={selected} locations={locations} statuses={statuses} templates={templates} onSuccess={() => setSelected([])} />
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-zinc-400">{search ? 'No assets match your search.' : 'No assets yet.'}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                {canEdit && <th className="p-4 text-left w-8" />}
                <th className={thCls} onClick={() => toggleSort('name')}>Name <SortIcon active={sortKey==='name'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('assetTag')}>Tag <SortIcon active={sortKey==='assetTag'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('type')}>Type <SortIcon active={sortKey==='type'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('status')}>Status <SortIcon active={sortKey==='status'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('locationName')}>Location <SortIcon active={sortKey==='locationName'} dir={sortDir} /></th>
                <th className="p-4 text-left text-zinc-400">Tags</th>
                {canEdit && <th className="p-4 text-left" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                if (row.kind === 'kit') {
                  const isCollapsed = collapsedKits.has(row.kit.id)
                  return (
                    <tr key={`kit-${row.kit.id}`} className="border-b border-zinc-800 bg-zinc-800/30">
                      {canEdit && <td className="p-4 w-8" />}
                      <td className="p-4" colSpan={colSpan - (canEdit ? 1 : 0)}>
                        <button type="button" onClick={() => toggleKitCollapse(row.kit.id)}
                          className="flex items-center gap-2 text-left w-full group">
                          <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0">
                            {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </span>
                          <Boxes size={14} className="text-zinc-500 flex-shrink-0" />
                          <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">{row.kit.name}</span>
                          <span className="text-zinc-600 text-xs">{row.kit.kitCode}</span>
                          <span className="text-zinc-600 text-xs ml-1">
                            · {row.kit.items.length} item{row.kit.items.length !== 1 ? 's' : ''}
                          </span>
                          <Link href={`/kits/${row.kit.id}`}
                            onClick={e => e.stopPropagation()}
                            className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                            View kit →
                          </Link>
                        </button>
                      </td>
                    </tr>
                  )
                }

                // Asset row
                const { asset, inKit, kitHeader } = row
                const isEditing = canEdit && editingId === asset.id
                const isSelected = selected.includes(asset.id)
                const isCollapsed = kitHeader ? collapsedKits.has(kitHeader.id) : false

                return (
                  <tr key={`asset-${asset.id}`}
                    className={`border-b border-zinc-800 last:border-0 group transition-colors
                      ${isSelected ? 'bg-zinc-800/50' : inKit ? 'bg-zinc-950/40' : ''}`}>
                    {canEdit && (
                      <td className="p-4 w-8">
                        <input type="checkbox" checked={isSelected} onChange={() => {}}
                          onClick={e => { e.stopPropagation(); toggle(asset.id, rowIndex, e.shiftKey) }}
                          className="w-4 h-4 accent-white align-middle cursor-pointer" />
                      </td>
                    )}

                    {isEditing ? (
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
                            placeholder="type" className="rounded-lg bg-zinc-800 px-3 py-1 text-white border border-zinc-700 w-full" />
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
                          <TagSelector allTags={allTags} selectedIds={[...editTags]}
                            onChange={ids => setEditTags(new Set(ids))} canCreate={canAdmin} disabled={isPending} />
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
                          <div className="flex items-center gap-1.5" style={{ paddingLeft: inKit ? 20 : 0 }}>
                            {kitHeader && (
                              <button type="button" onClick={() => toggleKitCollapse(kitHeader.id)}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                            <Link href={`/assets/${asset.id}`} className="hover:underline">{asset.name}</Link>
                            {kitHeader && (
                              <>
                                <span className="text-zinc-600 text-xs">{kitHeader.name}</span>
                                <span className="text-zinc-700 text-xs">
                                  · {kitHeader.items.length} item{kitHeader.items.length !== 1 ? 's' : ''}
                                </span>
                                <Link href={`/kits/${kitHeader.id}`}
                                  onClick={e => e.stopPropagation()}
                                  className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                                  View kit →
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400">{asset.assetTag}</td>
                        <td className="p-4 text-zinc-400">{asset.type || '—'}</td>
                        <td className="p-4">{asset.status}</td>
                        <td className="p-4 text-zinc-400">{asset.location?.name ?? '—'}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(asset.tags ?? []).map(({ tag }) => (
                              <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}>{tag.name}</span>
                            ))}
                          </div>
                        </td>
                        {canEdit && (
                          <td className="p-4">
                            <button type="button" onClick={() => startEdit(asset)}
                              className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
