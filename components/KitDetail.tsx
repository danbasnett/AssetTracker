'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { setKitContainer, addAssetToKit, removeAssetFromKit, updateKit, deleteKit } from '../app/actions'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, Boxes, Package, Pencil, Trash2 } from 'lucide-react'

type AssetOption = { id: number; name: string; assetTag: string; status: string }
type KitItem = { asset: AssetOption }

type Kit = {
  id: number
  name: string
  kitCode: string
  container: AssetOption | null
  items: KitItem[]
}

function AssetSearchDropdown({ options, onSelect, placeholder }: {
  options: AssetOption[]
  onSelect: (id: number) => void
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function down(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  const filtered = options.filter(a =>
    !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.assetTag.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
        <span>{placeholder ?? 'Select asset…'}</span>
        <ChevronDown size={13} className="flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="p-2 border-b border-zinc-800">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none" />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map(a => (
              <button key={a.id} type="button"
                onClick={() => { onSelect(a.id); setOpen(false); setQ('') }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-zinc-800">
                <span className="flex-1 text-zinc-200 truncate">{a.name}</span>
                <span className="text-zinc-600 flex-shrink-0">{a.assetTag}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No assets found</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function KitDetail({ kit, allAssets, canEdit }: {
  kit: Kit
  allAssets: AssetOption[]
  canEdit: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(kit.name)
  const [editCode, setEditCode] = useState(kit.kitCode)
  const router = useRouter()

  const itemAssetIds = new Set(kit.items.map(i => i.asset.id))
  const containerId = kit.container?.id ?? null

  // Assets available as container: anything not already a content item
  const containerOptions = allAssets.filter(a => !itemAssetIds.has(a.id))
  // Assets available as contents: anything not the container, not already in kit
  const contentOptions = allAssets.filter(a => a.id !== containerId && !itemAssetIds.has(a.id))

  function handleSetContainer(assetId: number | null) {
    startTransition(async () => {
      const result = await setKitContainer(kit.id, assetId)
      if (result?.error) setError(result.error)
    })
  }

  function handleAddContent(assetId: number) {
    startTransition(async () => {
      const result = await addAssetToKit(kit.id, assetId)
      if (result?.error) setError(result.error)
    })
  }

  function handleRemoveContent(assetId: number) {
    startTransition(async () => {
      const result = await removeAssetFromKit(kit.id, assetId)
      if (result?.error) setError(result.error)
    })
  }

  function handleSaveName() {
    startTransition(async () => {
      const result = await updateKit(kit.id, { name: editName, kitCode: editCode })
      if (result?.error) { setError(result.error); return }
      setEditingName(false)
    })
  }

  function handleDelete() {
    if (!confirm(`Delete kit "${kit.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteKit(kit.id)
      router.push('/kits')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Header: name / kit code */}
      <div className="flex items-start justify-between gap-4">
        {editingName ? (
          <div className="flex flex-col gap-2 flex-1">
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-xl font-semibold text-white focus:outline-none focus:border-zinc-500 w-full" />
            <input value={editCode} onChange={e => setEditCode(e.target.value)}
              className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 focus:outline-none focus:border-zinc-500 w-48" />
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveName} disabled={isPending}
                className="rounded-lg bg-white px-3 py-1.5 text-black text-xs font-medium disabled:opacity-50">Save</button>
              <button type="button" onClick={() => { setEditingName(false); setEditName(kit.name); setEditCode(kit.kitCode) }}
                className="rounded-lg bg-zinc-700 px-3 py-1.5 text-white text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-2">
              <Boxes size={26} className="text-zinc-500" />
              {kit.name}
            </h1>
            <p className="mt-1 text-zinc-500 text-sm">{kit.kitCode}</p>
          </div>
        )}
        {canEdit && !editingName && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => setEditingName(true)}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Container */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-semibold flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wider">
            <Package size={15} /> Container
          </h2>
          {canEdit && (
            <div className="flex items-center gap-2">
              {kit.container ? (
                <button type="button" onClick={() => handleSetContainer(null)} disabled={isPending}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50">
                  Remove
                </button>
              ) : (
                <AssetSearchDropdown
                  options={containerOptions}
                  onSelect={handleSetContainer}
                  placeholder="Assign container…"
                />
              )}
            </div>
          )}
        </div>

        {kit.container ? (
          <Link href={`/assets/${kit.container.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors group">
            <Package size={18} className="text-zinc-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate group-hover:underline">{kit.container.name}</p>
              <p className="text-xs text-zinc-500">{kit.container.assetTag}</p>
            </div>
            <span className="text-xs text-zinc-500 flex-shrink-0">{kit.container.status}</span>
          </Link>
        ) : (
          <p className="text-sm text-zinc-600">No container assigned.</p>
        )}
      </section>

      {/* Contents */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-semibold flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wider">
            <Boxes size={15} /> Contents
            <span className="text-zinc-600 normal-case tracking-normal font-normal">
              {kit.items.length} item{kit.items.length !== 1 ? 's' : ''}
            </span>
          </h2>
          {canEdit && (
            <AssetSearchDropdown
              options={contentOptions}
              onSelect={handleAddContent}
              placeholder="Add asset…"
            />
          )}
        </div>

        {kit.items.length === 0 ? (
          <p className="text-sm text-zinc-600">No assets in this kit yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {kit.items.map(({ asset }) => (
              <div key={asset.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Link href={`/assets/${asset.id}`}
                  className="flex-1 min-w-0 flex items-center gap-3 group">
                  <div className="min-w-0">
                    <p className="text-sm text-white group-hover:underline truncate">{asset.name}</p>
                    <p className="text-xs text-zinc-500">{asset.assetTag}</p>
                  </div>
                </Link>
                <span className="text-xs text-zinc-500 flex-shrink-0">{asset.status}</span>
                {canEdit && (
                  <button type="button" onClick={() => handleRemoveContent(asset.id)} disabled={isPending}
                    className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
