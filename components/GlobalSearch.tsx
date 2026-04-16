'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

type ResultItem = { id: number; title: string; sub?: string; badge?: string; href: string }
type ResultGroup = { type: string; items: ResultItem[] }

const BADGE_STYLE: Record<string, string> = {
  PENDING:     'bg-orange-950 text-orange-300',
  SCHEDULED:   'bg-blue-950 text-blue-300',
  IN_PROGRESS: 'bg-yellow-950 text-yellow-300',
  COMPLETED:   'bg-green-950 text-green-300',
  CANCELLED:   'bg-zinc-800 text-zinc-400',
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<ResultGroup[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const allItems = groups.flatMap(g => g.items)

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setGroups([]); setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setGroups(data.results ?? [])
      setActiveIndex(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 250)
    return () => clearTimeout(timer)
  }, [query, fetchResults])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || allItems.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter') {
      const item = allItems[activeIndex]
      if (item) { router.push(item.href); setOpen(false); setQuery('') }
    }
  }

  function clear() {
    setQuery('')
    setGroups([])
    setOpen(false)
    inputRef.current?.blur()
  }

  let flatIndex = 0

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search… (⌘K)"
          className="w-full rounded-xl bg-zinc-800 pl-9 pr-8 py-2 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
        />
        {query && (
          <button type="button" onClick={clear} className="absolute right-2.5 text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && groups.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500">Searching…</p>
          )}
          {!loading && groups.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500">No results for "{query}"</p>
          )}
          {groups.map(group => (
            <div key={group.type}>
              <p className="px-4 pt-3 pb-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">{group.type}</p>
              {group.items.map(item => {
                const idx = flatIndex++
                const active = idx === activeIndex
                return (
                  <button
                    key={`${group.type}-${item.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => { router.push(item.href); setOpen(false); setQuery('') }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${active ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{item.title}</p>
                      {item.sub && <p className="text-xs text-zinc-500 truncate">{item.sub}</p>}
                    </div>
                    {item.badge && (
                      <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STYLE[item.badge] ?? 'bg-zinc-800 text-zinc-300'}`}>
                        {item.badge.replace('_', ' ')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
