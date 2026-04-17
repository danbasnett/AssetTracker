'use client'

import { useActionState, useTransition, useState, useEffect } from 'react'
import { upsertTag, deleteTag } from '../app/actions'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import ColorPicker from './ColorPicker'

type Tag = { id: number; name: string; color: string }

function TagForm({ tag, onDone }: { tag?: Tag; onDone: () => void }) {
  const [state, formAction] = useActionState(upsertTag, null)
  const [color, setColor] = useState(tag?.color ?? '#6366f1')

  useEffect(() => { if (state?.success) onDone() }, [state])

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {tag && <input type="hidden" name="id" value={tag.id} />}
      <input type="hidden" name="color" value={color} />

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Name</label>
        <input name="name" required defaultValue={tag?.name} placeholder="e.g. Critical"
          className="rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm w-44" />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Colour</label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#64748b'].map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform flex-shrink-0"
              style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }} />
          ))}
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-black text-sm font-medium hover:bg-zinc-200">
          <Check size={14} /> {tag ? 'Save' : 'Add'}
        </button>
        {tag && (
          <button type="button" onClick={onDone} className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-3 py-2 text-zinc-300 text-sm hover:bg-zinc-700">
            <X size={14} /> Cancel
          </button>
        )}
      </div>

      {state?.error && <p className="text-red-400 text-sm w-full">{state.error}</p>}
    </form>
  )
}

export default function SettingsTagList({ tags }: { tags: Tag[] }) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function handleDelete(id: number) {
    if (!confirm('Delete this tag? It will be removed from all assets.')) return
    startTransition(async () => { await deleteTag(id) })
  }

  return (
    <div className="space-y-4">
      {tags.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {tags.map(tag => (
            <div key={tag.id} className="px-6 py-4">
              {editingId === tag.id ? (
                <TagForm tag={tag} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="text-sm font-medium">{tag.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(tag.id)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-300 hover:bg-red-900/50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tags.length === 0 && <p className="text-zinc-500 text-sm">No tags yet.</p>}

      <TagForm onDone={() => {}} />
    </div>
  )
}
