'use client'

import { useActionState, useTransition, useState, useEffect, useRef } from 'react'
import { addPlanItem, addKitPlanItem, updatePlanItem, deletePlanItem } from '../app/actions'
import { Pencil, Trash2, X, Check, Plus, Boxes, ChevronDown } from 'lucide-react'

type PlanItem = {
  id: number
  description: string
  modelNumber: string | null
  quantity: number
  notes: string | null
  kitId: number | null
  kit: {
    id: number
    name: string
    kitCode: string
    items: { asset: { id: number } }[]
  } | null
}

type Template = { id: number; name: string; modelNumber: string | null }
type AssignedAsset = { type?: string | null; modelNumber?: string | null; id: number }
type KitOption = { id: number; name: string; kitCode: string; items: { asset: { id: number; name: string; assetTag: string } }[] }

function KitPicker({ kits, onPick }: { kits: KitOption[]; onPick: (id: number) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function down(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  const filtered = kits.filter(k => !q || k.name.toLowerCase().includes(q.toLowerCase()) || k.kitCode.toLowerCase().includes(q.toLowerCase()))

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
        <Boxes size={14} /> Add kit to plan
        <ChevronDown size={12} className="text-zinc-500" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="p-2 border-b border-zinc-800">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search kits…"
              className="w-full bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none" />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map(k => (
              <button key={k.id} type="button" onClick={() => { onPick(k.id); setOpen(false); setQ('') }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-zinc-800">
                <span className="text-zinc-200 truncate">{k.name}</span>
                <span className="text-zinc-600 flex-shrink-0">{k.kitCode} · {k.items.length} items</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No kits found</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function PlanItemForm({ allocationId, item, templates, onDone }: {
  allocationId: number; item?: PlanItem; templates: Template[]; onDone: () => void
}) {
  const action = item ? updatePlanItem : addPlanItem
  const [state, formAction] = useActionState(action, null)
  const [description, setDescription] = useState(item?.description ?? '')
  const [modelNumber, setModelNumber] = useState(item?.modelNumber ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (state?.success) onDone() }, [state])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = templates.filter(t => description && t.name.toLowerCase().includes(description.toLowerCase())).slice(0, 6)

  function applyTemplate(t: Template) { setDescription(t.name); setModelNumber(t.modelNumber ?? ''); setShowSuggestions(false) }

  return (
    <form action={formAction} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      {!item && <input type="hidden" name="allocationId" value={allocationId} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div ref={containerRef} className="relative">
          <label className="block text-xs text-zinc-400 mb-1">Asset type / name <span className="text-red-400">*</span></label>
          <input name="description" required value={description}
            onChange={e => { setDescription(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g. Gigacore 10T"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-30 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
              {suggestions.map(t => (
                <button key={t.id} type="button" onMouseDown={e => { e.preventDefault(); applyTemplate(t) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800">
                  <span className="text-sm text-white">{t.name}</span>
                  {t.modelNumber && <span className="text-xs text-zinc-500 ml-2">{t.modelNumber}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Model number</label>
          <input name="modelNumber" value={modelNumber} onChange={e => setModelNumber(e.target.value)} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Quantity <span className="text-red-400">*</span></label>
          <input name="quantity" type="number" min="1" defaultValue={item?.quantity ?? 1}
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Notes</label>
          <input name="notes" defaultValue={item?.notes ?? ''} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
          <Check size={14} /> {item ? 'Save' : 'Add'}
        </button>
        <button type="button" onClick={onDone} className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-zinc-300 text-sm hover:bg-zinc-700">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  )
}

export default function AllocationPlan({ allocationId, planItems, assignedAssets, templates, kits, canManage }: {
  allocationId: number
  planItems: PlanItem[]
  assignedAssets: AssignedAsset[]
  templates: Template[]
  kits: KitOption[]
  canManage: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const allocatedIds = new Set(assignedAssets.map(a => a.id))

  function fulfilledCount(item: PlanItem) {
    if (item.kit) return item.kit.items.filter(i => allocatedIds.has(i.asset.id)).length
    const descKey = item.description.toLowerCase()
    const modelKey = item.modelNumber?.toLowerCase()
    return assignedAssets.filter(a => {
      const aType = (a as any).type?.toLowerCase()
      const aModel = (a as any).modelNumber?.toLowerCase()
      return (aType && aType === descKey) || (modelKey && aModel && aModel === modelKey)
    }).length
  }

  function totalNeeded(item: PlanItem) {
    return item.kit ? item.kit.items.length : item.quantity
  }

  function handleDelete(id: number) {
    if (!confirm('Remove this planned item?')) return
    startTransition(async () => { await deletePlanItem(id) })
  }

  function handleAddKit(kitId: number) {
    startTransition(async () => { await addKitPlanItem(allocationId, kitId) })
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Planned Assets</h2>

      {planItems.length === 0 && !adding && (
        <p className="text-zinc-500 text-sm">No planned assets. Use the buttons below to define what this allocation needs.</p>
      )}

      {planItems.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {planItems.map(item => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="px-6 py-4">
                  <PlanItemForm allocationId={allocationId} item={item} templates={templates} onDone={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="px-6 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.kit && <Boxes size={13} className="text-zinc-500 flex-shrink-0" />}
                        <p className="font-medium text-white">{item.description}</p>
                        {item.kit && <span className="text-xs text-zinc-500">{item.kit.kitCode}</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.kit
                          ? `${item.kit.items.length} item${item.kit.items.length !== 1 ? 's' : ''} in kit`
                          : [item.modelNumber && `Model: ${item.modelNumber}`, item.notes].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm ${
                        fulfilledCount(item) > totalNeeded(item) ? 'text-red-400' :
                        fulfilledCount(item) >= totalNeeded(item) ? 'text-green-400' : 'text-zinc-300'
                      }`}>
                        {fulfilledCount(item)}/{totalNeeded(item)}
                      </span>
                      {canManage && (
                        <div className="flex gap-1">
                          {!item.kit && (
                            <button onClick={() => setEditingId(item.id)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                              <Pencil size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-300 hover:bg-red-900/50">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        fulfilledCount(item) > totalNeeded(item) ? 'bg-red-500' :
                        fulfilledCount(item) >= totalNeeded(item) ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, totalNeeded(item) > 0 ? (fulfilledCount(item) / totalNeeded(item)) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4">
          <PlanItemForm allocationId={allocationId} templates={templates} onDone={() => setAdding(false)} />
        </div>
      ) : canManage && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
            <Plus size={15} /> Add planned item
          </button>
          {kits.length > 0 && <KitPicker kits={kits} onPick={handleAddKit} />}
        </div>
      )}
    </div>
  )
}
