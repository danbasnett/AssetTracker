'use client'

import { useActionState, useTransition, useState, useEffect, useRef } from 'react'
import { addPlanItem, updatePlanItem, deletePlanItem } from '../app/actions'
import { Pencil, Trash2, X, Check, Plus } from 'lucide-react'

type PlanItem = {
  id: number
  description: string
  modelNumber: string | null
  quantity: number
  notes: string | null
}

type Template = {
  id: number
  name: string
  modelNumber: string | null
}

type AssignedAsset = {
  type?: string | null
  modelNumber?: string | null
}

function PlanItemForm({
  allocationId,
  item,
  templates,
  onDone,
}: {
  allocationId: number
  item?: PlanItem
  templates: Template[]
  onDone: () => void
}) {
  const action = item ? updatePlanItem : addPlanItem
  const [state, formAction] = useActionState(action, null)
  const [description, setDescription] = useState(item?.description ?? '')
  const [modelNumber, setModelNumber] = useState(item?.modelNumber ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state?.success) onDone()
  }, [state])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const suggestions = templates.filter(t =>
    description && t.name.toLowerCase().includes(description.toLowerCase())
  ).slice(0, 6)

  function applyTemplate(t: Template) {
    setDescription(t.name)
    setModelNumber(t.modelNumber ?? '')
    setShowSuggestions(false)
  }

  return (
    <form action={formAction} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      {!item && <input type="hidden" name="allocationId" value={allocationId} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div ref={containerRef} className="relative">
          <label className="block text-xs text-zinc-400 mb-1">Asset type / name <span className="text-red-400">*</span></label>
          <input
            name="description"
            required
            value={description}
            onChange={e => { setDescription(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g. Gigacore 10T"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 z-30 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
              {suggestions.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); applyTemplate(t) }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800"
                >
                  <span className="text-sm text-white">{t.name}</span>
                  {t.modelNumber && <span className="text-xs text-zinc-500 ml-2">{t.modelNumber}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Model number</label>
          <input
            name="modelNumber"
            value={modelNumber}
            onChange={e => setModelNumber(e.target.value)}
            placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Quantity <span className="text-red-400">*</span></label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={item?.quantity ?? 1}
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Notes</label>
          <input
            name="notes"
            defaultValue={item?.notes ?? ''}
            placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm"
          />
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

export default function AllocationPlan({
  allocationId,
  planItems,
  assignedAssets,
  templates,
  canManage,
}: {
  allocationId: number
  planItems: PlanItem[]
  assignedAssets: AssignedAsset[]
  templates: Template[]
  canManage: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  // Count assigned assets per type/modelNumber (case-insensitive) for progress
  // An asset contributes to a plan item if its type OR modelNumber matches the item's description OR modelNumber
  function fulfilledCount(item: PlanItem) {
    const descKey = item.description.toLowerCase()
    const modelKey = item.modelNumber?.toLowerCase()
    return assignedAssets.filter(a => {
      const aType = a.type?.toLowerCase()
      const aModel = a.modelNumber?.toLowerCase()
      if (aType && aType === descKey) return true
      if (modelKey && aModel && aModel === modelKey) return true
      return false
    }).length
  }

  function handleDelete(id: number) {
    if (!confirm('Remove this planned item?')) return
    startTransition(async () => { await deletePlanItem(id) })
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Planned Assets</h2>

      {planItems.length === 0 && !adding && (
        <p className="text-zinc-500 text-sm">No planned assets. Use the button below to define what this allocation needs.</p>
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
                      <p className="font-medium text-white">{item.description}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {[
                          item.modelNumber && `Model: ${item.modelNumber}`,
                          item.notes,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm">
                        <span className={
                          fulfilledCount(item) > item.quantity ? 'text-red-400' :
                          fulfilledCount(item) >= item.quantity ? 'text-green-400' :
                          'text-zinc-300'
                        }>
                          {fulfilledCount(item)}/{item.quantity}
                        </span>
                      </span>
                      {canManage && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditingId(item.id)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                            <Pencil size={13} />
                          </button>
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
                        fulfilledCount(item) > item.quantity ? 'bg-red-500' :
                        fulfilledCount(item) >= item.quantity ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, (fulfilledCount(item) / item.quantity) * 100)}%` }}
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
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
        >
          <Plus size={15} /> Add planned item
        </button>
      )}
    </div>
  )
}
