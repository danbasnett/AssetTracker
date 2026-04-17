'use client'

import { useState, useTransition, useRef, useEffect, lazy, Suspense } from 'react'
import { addAssetToAllocation, removeAssetFromAllocation } from '../app/actions'
import Link from 'next/link'
import { ScanLine } from 'lucide-react'

const BarcodeScanner = lazy(() => import('./BarcodeScanner'))

type AllocatedAsset = {
  id: number
  name: string
  assetTag: string
  status: string
  location: { name: string } | null
}

type Allocation = {
  id: number
  assets: AllocatedAsset[]
}

type Asset = {
  id: number
  name: string
  assetTag: string
}

type Mode = 'assign' | 'deassign'

export default function AllocationDetail({ allocation, allAssets, canManage }: { allocation: Allocation; allAssets: Asset[]; canManage: boolean }) {
  const [mode, setMode] = useState<Mode>('assign')
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allocatedIds = new Set(allocation.assets.map(a => a.id))
  const available = allAssets.filter(a => !allocatedIds.has(a.id))

  const suggestions = (mode === 'assign' ? available : allAssets.filter(a => allocatedIds.has(a.id)))
    .filter(a =>
      !query ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.assetTag.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 8)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); handleSelect(suggestions[activeIndex]) }
    if (e.key === 'Escape')    { setShowSuggestions(false) }
  }

  function handleSelect(asset: Asset) {
    setQuery('')
    setShowSuggestions(false)
    setError(null)
    startTransition(async () => {
      let result: any
      if (mode === 'assign') {
        const fd = new FormData()
        fd.append('allocationId', String(allocation.id))
        fd.append('assetId', String(asset.id))
        result = await addAssetToAllocation(null, fd)
      } else {
        result = await removeAssetFromAllocation(allocation.id, asset.id)
      }
      if (result?.error) setError(result.error)
    })
    inputRef.current?.focus()
  }

  function handleScanResult(text: string) {
    setScanning(false)
    setQuery(text)
    setShowSuggestions(true)
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  return (
    <>
    {scanning && (
      <Suspense fallback={null}>
        <BarcodeScanner onResult={handleScanResult} onClose={() => setScanning(false)} />
      </Suspense>
    )}
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Assets</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {allocation.assets.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">No assets in this allocation yet.</p>
          ) : (
            allocation.assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="min-w-0">
                  <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                    {asset.name}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {asset.assetTag}
                    {asset.location && ` · ${asset.location.name}`}
                  </p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{asset.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {canManage && (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-zinc-800 p-1 gap-1 w-fit">
            <button
              type="button"
              onClick={() => { setMode('assign'); setQuery('') }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === 'assign' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Assign
            </button>
            <button
              type="button"
              onClick={() => { setMode('deassign'); setQuery('') }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${mode === 'deassign' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
            >
              Remove
            </button>
          </div>

          {/* Search input */}
          <div ref={containerRef} className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); setActiveIndex(0) }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'assign' ? 'Search assets to add…' : 'Search assets to remove…'}
              disabled={isPending}
              className="w-full rounded-xl bg-zinc-800 pl-4 pr-10 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              title="Scan barcode"
            >
              <ScanLine size={18} />
            </button>

            {showSuggestions && (
              <div className="absolute top-full mt-1 left-0 right-0 z-30 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                {suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-zinc-500">
                    {query ? 'No matches' : mode === 'assign' ? 'No assets available to add' : 'No assets to remove'}
                  </p>
                ) : (
                  suggestions.map((a, i) => (
                    <button
                      key={a.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseDown={e => { e.preventDefault(); handleSelect(a) }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${i === activeIndex ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
                    >
                      <span className="text-sm text-white">{a.name}</span>
                      <span className="text-xs text-zinc-500 ml-3">{a.assetTag}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}
    </div>
    </>
  )
}
