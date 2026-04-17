'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { bulkUpdateAssets } from '../app/actions'

type Location = { id: number; name: string }
type Status = { id: number; name: string }
type Template = { id: number; name: string; type: string }

export default function BulkEditBar({ selectedIds, locations, statuses, templates, onSuccess }: {
  selectedIds: number[]
  locations: Location[]
  statuses: Status[]
  templates: Template[]
  onSuccess: () => void
}) {
  const [state, formAction] = useActionState(bulkUpdateAssets, null)
  const [typeQuery, setTypeQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = templates.filter(t =>
    typeQuery && (t.type || t.name).toLowerCase().includes(typeQuery.toLowerCase())
  ).map(t => t.type || t.name).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)

  if (selectedIds.length < 2) return null

  return (
    <form action={formAction} className="flex flex-wrap gap-2 items-center">
      {selectedIds.map(id => (
        <input key={id} type="hidden" name="selectedIds" value={id} />
      ))}

      <select name="status" defaultValue=""
        className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm">
        <option value="">— status —</option>
        {statuses.map(s => (
          <option key={s.id} value={s.name}>{s.name}</option>
        ))}
      </select>

      <select name="locationId" defaultValue=""
        className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm">
        <option value="">— location —</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <div ref={containerRef} className="relative">
        <input
          name="type"
          value={typeQuery}
          onChange={e => { setTypeQuery(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="— type —"
          className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-36"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 z-30 w-48 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
            {suggestions.map(s => (
              <button key={s} type="button"
                onMouseDown={e => { e.preventDefault(); setTypeQuery(s); setShowSuggestions(false) }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-800">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="submit"
        className="rounded-xl bg-zinc-700 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-600">
        Apply
      </button>

      {state?.error && <span className="text-red-400 text-sm">{state.error}</span>}
    </form>
  )
}
