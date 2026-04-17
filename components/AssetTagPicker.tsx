'use client'

import { useState, useTransition, useEffect } from 'react'
import { setAssetTags } from '../app/actions'
import TagSelector from './TagSelector'

type Tag = { id: number; name: string; color: string }

export default function AssetTagPicker({ assetId, allTags, currentTagIds, canEdit, canAdmin = false }: {
  assetId: number
  allTags: Tag[]
  currentTagIds: number[]
  canEdit: boolean
  canAdmin?: boolean
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>(currentTagIds)
  const [isPending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(ids: number[]) {
    setSelectedIds(ids)
    setDirty(true)
  }

  function save() {
    startTransition(async () => {
      const result = await setAssetTags(assetId, selectedIds)
      if (result?.error) setError(result.error)
      else { setDirty(false); setError(null) }
    })
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Tags</h3>
      <TagSelector
        allTags={allTags}
        selectedIds={selectedIds}
        onChange={handleChange}
        canCreate={canAdmin}
        disabled={!canEdit || isPending}
      />
      {canEdit && dirty && (
        <div className="mt-3 flex items-center gap-2">
          <button onClick={save} disabled={isPending}
            className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium hover:bg-zinc-200 disabled:opacity-50">
            Save tags
          </button>
          <button onClick={() => { setSelectedIds(currentTagIds); setDirty(false) }}
            className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-300 text-xs hover:bg-zinc-700">
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
