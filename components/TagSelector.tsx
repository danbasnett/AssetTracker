'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { upsertTag } from '../app/actions'
import ColorPicker from './ColorPicker'

type Tag = { id: number; name: string; color: string }

const DEFAULT_COLOR = '#6366f1'

export default function TagSelector({ allTags: initialTags, selectedIds, onChange, canCreate = false, disabled = false }: {
  allTags: Tag[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  canCreate?: boolean
  disabled?: boolean
}) {
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const selected = new Set(selectedIds)
  const filtered = tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
  const exactMatch = tags.some(t => t.name.toLowerCase() === query.toLowerCase())

  function toggle(id: number) {
    if (disabled) return
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange([...next])
  }

  function remove(id: number) {
    onChange(selectedIds.filter(i => i !== id))
  }

  function createTag() {
    if (!query.trim()) return
    const formData = new FormData()
    formData.set('name', query.trim())
    formData.set('color', newColor)
    startTransition(async () => {
      const result = await upsertTag(null, formData)
      if (result?.error) { setError(result.error); return }
      if (result?.tag) {
        const t = result.tag as Tag
        setTags(prev => [...prev, t])
        onChange([...selectedIds, t.id])
      }
      setQuery('')
      setCreating(false)
      setError(null)
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`min-h-[36px] flex flex-wrap gap-1 items-center px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 cursor-text ${disabled ? 'opacity-60 cursor-default' : ''}`}
        onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus() } }}
      >
        {selectedIds.map(id => {
          const tag = tags.find(t => t.id === id)
          if (!tag) return null
          return (
            <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}>
              {tag.name}
              {!disabled && (
                <button type="button" onClick={e => { e.stopPropagation(); remove(id) }}
                  className="hover:opacity-70 leading-none">&times;</button>
              )}
            </span>
          )
        })}
        {!disabled && (
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setCreating(false) }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
            placeholder={selectedIds.length === 0 ? 'Add tags…' : ''}
            className="flex-1 min-w-[80px] bg-transparent text-white text-xs outline-none placeholder-zinc-500"
          />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-2 text-xs text-zinc-500">No tags found.</p>
            )}
            {filtered.map(tag => (
              <button key={tag.id} type="button"
                onClick={() => { toggle(tag.id); setQuery('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 text-left">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="text-white">{tag.name}</span>
                {selected.has(tag.id) && <span className="ml-auto text-zinc-400">✓</span>}
              </button>
            ))}
          </div>

          {canCreate && query.trim() && !exactMatch && (
            <div className="border-t border-zinc-800">
              {!creating ? (
                <button type="button" onClick={() => setCreating(true)}
                  className="w-full px-3 py-2 text-xs text-left text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  + Create "<span className="text-white">{query.trim()}</span>"
                </button>
              ) : (
                <div className="p-3 flex flex-col gap-2">
                  <p className="text-xs text-zinc-400">Colour for <span className="text-white font-medium">"{query.trim()}"</span></p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6','#f97316','#84cc16'].map(c => (
                      <button key={c} type="button" onClick={() => setNewColor(c)}
                        className="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0"
                        style={{ backgroundColor: c, borderColor: newColor === c ? 'white' : 'transparent' }} />
                    ))}
                    <ColorPicker value={newColor} onChange={setNewColor} />
                  </div>
                  {error && <p className="text-red-400 text-xs">{error}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={createTag} disabled={isPending}
                      className="rounded-lg bg-white px-3 py-1 text-black text-xs font-medium disabled:opacity-50">
                      {isPending ? 'Creating…' : 'Create'}
                    </button>
                    <button type="button" onClick={() => setCreating(false)}
                      className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
