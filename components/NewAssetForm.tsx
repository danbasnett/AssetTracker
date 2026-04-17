'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine, LayoutTemplate, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { addAsset } from '../app/actions'
import DatePicker from './DatePicker'
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false })

type Location = { id: number; name: string }
type Status = { id: number; name: string }
type Template = {
  id: number
  name: string
  type: string
  modelNumber: string | null
  supplier: string | null
  value: number | null
  locationId: number | null
  notes: string | null
}

export default function NewAssetForm({ locations, statuses, templates }: { locations: Location[]; statuses: Status[]; templates: Template[] }) {
  const [state, formAction] = useActionState(addAsset, null)
  const [assetTag, setAssetTag] = useState('')
  const [scanning, setScanning] = useState(false)
  const router = useRouter()

  // Template search state
  const [templateQuery, setTemplateQuery] = useState('')
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false)
  const [appliedTemplate, setAppliedTemplate] = useState<Template | null>(null)
  const templateContainerRef = useRef<HTMLDivElement>(null)

  // Controlled fields populated by template
  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [supplier, setSupplier] = useState('')
  const [value, setValue] = useState('')
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')

  // Type field typeahead
  const [typeQuery, setTypeQuery] = useState('')
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false)
  const typeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeContainerRef.current && !typeContainerRef.current.contains(e.target as Node)) setShowTypeSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const typeSuggestions = templates.filter(t =>
    typeQuery && t.name.toLowerCase().includes(typeQuery.toLowerCase())
  ).slice(0, 6)

  useEffect(() => {
    if (state?.success) router.push('/assets')
  }, [state])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (templateContainerRef.current && !templateContainerRef.current.contains(e.target as Node)) {
        setShowTemplateSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const templateSuggestions = templates.filter(t =>
    !templateQuery || t.name.toLowerCase().includes(templateQuery.toLowerCase())
  ).slice(0, 8)

  function applyTemplate(t: Template) {
    setAppliedTemplate(t)
    setTemplateQuery(t.name)
    setShowTemplateSuggestions(false)
    const resolvedType = t.type || t.name
    setType(resolvedType)
    setTypeQuery(resolvedType)
    if (t.modelNumber) setModelNumber(t.modelNumber)
    if (t.supplier) setSupplier(t.supplier)
    if (t.value != null) setValue(String(t.value))
    if (t.locationId) setLocationId(String(t.locationId))
    if (t.notes) setNotes(t.notes)
  }

  function clearTemplate() {
    setAppliedTemplate(null)
    setTemplateQuery('')
  }

  return (
    <>
    {scanning && (
      <BarcodeScanner
        onResult={text => { setAssetTag(text); setScanning(false) }}
        onClose={() => setScanning(false)}
      />
    )}
    <form action={formAction} className="mt-8 space-y-6">
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      {/* Template picker */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Template</h2>
        <div ref={templateContainerRef} className="relative">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4">
            <LayoutTemplate size={16} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={templateQuery}
              onChange={e => { setTemplateQuery(e.target.value); setShowTemplateSuggestions(true) }}
              onFocus={() => setShowTemplateSuggestions(true)}
              placeholder="Search templates to auto-fill fields…"
              className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none"
            />
            {appliedTemplate && (
              <button type="button" onClick={clearTemplate} className="text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
          {showTemplateSuggestions && templateQuery && (
            <div className="absolute top-full mt-1 left-0 right-0 z-30 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
              {templateSuggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-500">No templates match</p>
              ) : (
                templateSuggestions.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); applyTemplate(t) }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-800 transition-colors"
                  >
                    <span className="text-sm text-white">{t.name}</span>
                    <span className="text-xs text-zinc-500 ml-3">{t.modelNumber ?? ''}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {appliedTemplate && (
          <p className="mt-2 text-xs text-zinc-500">Fields pre-filled from template. You can edit them before saving.</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Basic Info</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Name <span className="text-red-400">*</span></label>
            <input name="name" required placeholder="e.g. DeWalt Drill"
              value={name} onChange={e => setName(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4" ref={typeContainerRef}>
            <label className="text-zinc-400 w-36 shrink-0">Type <span className="text-red-400">*</span></label>
            <div className="flex-1 relative">
              <input name="type" required placeholder="e.g. Gigacore 10T"
                value={typeQuery}
                onChange={e => { setTypeQuery(e.target.value); setType(e.target.value); setShowTypeSuggestions(true) }}
                onFocus={() => setShowTypeSuggestions(true)}
                className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
              {showTypeSuggestions && typeSuggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-30 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                  {typeSuggestions.map(t => (
                    <button key={t.id} type="button"
                      onMouseDown={e => { e.preventDefault(); setType(t.name); setTypeQuery(t.name); setShowTypeSuggestions(false) }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800">
                      <span className="text-sm text-white">{t.name}</span>
                      {t.modelNumber && <span className="text-xs text-zinc-500">{t.modelNumber}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Asset Tag <span className="text-red-400">*</span></label>
            <div className="flex-1 relative flex items-center">
              <input name="assetTag" required placeholder="e.g. DRILL-001"
                value={assetTag} onChange={e => setAssetTag(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 pl-3 pr-10 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
              <button type="button" onClick={() => setScanning(true)}
                className="absolute right-3 text-zinc-500 hover:text-white transition-colors" title="Scan barcode">
                <ScanLine size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Status</label>
            <select name="status" defaultValue={statuses[0]?.name ?? ''}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
              {statuses.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Location</label>
            <select name="locationId" value={locationId} onChange={e => setLocationId(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
              <option value="">No location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Identification</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Serial Number</label>
            <input name="serialNumber" placeholder="—"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Model Number</label>
            <input name="modelNumber" placeholder="—"
              value={modelNumber} onChange={e => setModelNumber(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Purchase</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Supplier</label>
            <input name="supplier" placeholder="—"
              value={supplier} onChange={e => setSupplier(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Purchase Date</label>
            <DatePicker name="purchaseDate" className="flex-1" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Value (£)</label>
            <input name="value" type="number" min="0" step="0.01" placeholder="—"
              value={value} onChange={e => setValue(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Notes</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-center px-6 py-4 gap-4">
            <textarea name="notes" placeholder="—" rows={3}
              value={notes} onChange={e => setNotes(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 resize-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit"
          className="rounded-xl bg-white px-6 py-2 text-black font-medium hover:bg-zinc-200">
          Add Asset
        </button>
        <button type="button" onClick={() => router.push('/assets')}
          className="rounded-xl bg-zinc-800 px-6 py-2 text-white hover:bg-zinc-700">
          Cancel
        </button>
      </div>
    </form>
    </>
  )
}
