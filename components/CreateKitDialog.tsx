'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createKit } from '../app/actions'
import { X, Boxes } from 'lucide-react'

export default function CreateKitDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [kitCode, setKitCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function reset() { setName(''); setKitCode(''); setError(null) }
  function handleClose() { reset(); setOpen(false) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createKit({ name, kitCode })
      if (result?.error) { setError(result.error); return }
      reset()
      setOpen(false)
      router.push(`/kits/${result.id}`)
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
        <Boxes size={16} /> Make Kit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Boxes size={18} className="text-zinc-400" /> New Kit
              </h2>
              <button type="button" onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Kit Name <span className="text-red-400">*</span></label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Electrical Toolbox"
                  required
                  autoFocus
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Kit ID <span className="text-red-400">*</span></label>
                <input
                  value={kitCode}
                  onChange={e => setKitCode(e.target.value)}
                  placeholder="e.g. KIT-001"
                  required
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={isPending}
                  className="flex-1 rounded-xl bg-white py-2 text-black font-medium text-sm disabled:opacity-50 hover:bg-zinc-200 transition-colors">
                  {isPending ? 'Creating…' : 'Create Kit'}
                </button>
                <button type="button" onClick={handleClose}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-white text-sm hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
