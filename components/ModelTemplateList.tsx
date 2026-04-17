'use client'

import { useActionState, useTransition, useState, useEffect } from 'react'
import { upsertModelTemplate, deleteModelTemplate } from '../app/actions'
import { Pencil, Trash2, X, Check } from 'lucide-react'

type Location = { id: number; name: string }
type Template = {
  id: number
  name: string
  type: string
  modelNumber: string | null
  supplier: string | null
  value: number | null
  locationId: number | null
  location: Location | null
  notes: string | null
}

function TemplateForm({
  template,
  locations,
  onDone,
}: {
  template?: Template
  locations: Location[]
  onDone: () => void
}) {
  const [state, formAction] = useActionState(upsertModelTemplate, null)

  useEffect(() => {
    if (state?.success) onDone()
  }, [state])

  return (
    <form action={formAction} className="space-y-3">
      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Name <span className="text-red-400">*</span></label>
          <input name="name" required defaultValue={template?.name} placeholder='e.g. MacBook Pro 14"'
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Type <span className="text-zinc-500 font-normal">(used to match assets)</span></label>
          <input name="type" defaultValue={template?.type ?? ''} placeholder="e.g. MacBook Pro"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Model Number</label>
          <input name="modelNumber" defaultValue={template?.modelNumber ?? ''} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Supplier</label>
          <input name="supplier" defaultValue={template?.supplier ?? ''} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Default Value (£)</label>
          <input name="value" type="number" min="0" step="0.01" defaultValue={template?.value ?? ''} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Default Location</label>
          <select name="locationId" defaultValue={template?.locationId ?? ''}
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm">
            <option value="">No default</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Notes</label>
          <input name="notes" defaultValue={template?.notes ?? ''} placeholder="—"
            className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
        </div>
      </div>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit"
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
          <Check size={14} /> {template ? 'Save' : 'Create'}
        </button>
        <button type="button" onClick={onDone}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-zinc-300 text-sm hover:bg-zinc-700">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  )
}

export default function ModelTemplateList({ templates, locations }: { templates: Template[]; locations: Location[] }) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [, startTransition] = useTransition()

  function handleDelete(id: number) {
    if (!confirm('Delete this template?')) return
    startTransition(async () => { await deleteModelTemplate(id) })
  }

  const filteredTemplates = templates.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.type ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.modelNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.supplier ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <input type="search" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
      {/* Existing templates */}
      {filteredTemplates.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {filteredTemplates.map(t => (
            <div key={t.id}>
              {editingId === t.id ? (
                <div className="px-6 py-4">
                  <TemplateForm template={t} locations={locations} onDone={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="flex items-center justify-between px-6 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {[
                        t.type && `Type: ${t.type}`,
                        t.modelNumber && `Model: ${t.modelNumber}`,
                        t.supplier && `Supplier: ${t.supplier}`,
                        t.value != null && `£${t.value.toFixed(2)}`,
                        t.location && t.location.name,
                      ].filter(Boolean).join(' · ') || 'No details'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditingId(t.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-300 hover:bg-red-900/50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !creating && (
        <p className="text-zinc-500 text-sm">No templates yet.</p>
      )}

      {/* Create form */}
      {creating ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">New Template</h2>
          <TemplateForm locations={locations} onDone={() => setCreating(false)} />
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="rounded-xl bg-white px-5 py-2.5 text-black font-medium text-sm hover:bg-zinc-200">
          + New Template
        </button>
      )}
    </div>
  )
}
