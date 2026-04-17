'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAllocation } from '../app/actions'
import DatePicker from './DatePicker'

export default function NewAllocationForm() {
  const [state, formAction] = useActionState(createAllocation, null)
  const [indefinite, setIndefinite] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) router.push('/allocations')
  }, [state])

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

      <input type="hidden" name="indefinite" value={String(indefinite)} />

      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Details</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Name <span className="text-red-400">*</span></label>
            <input name="name" required placeholder="e.g. Site A Deployment"
              className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-white placeholder-zinc-600 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">Start Date <span className="text-red-400">*</span></label>
            <DatePicker name="startDate" className="flex-1" />
          </div>
          <div className="flex items-center px-6 py-4 gap-4">
            <label className="text-zinc-400 w-36 shrink-0">End Date</label>
            <div className="flex-1 flex items-center gap-4">
              {!indefinite && (
                <DatePicker name="endDate" className="flex-1" />
              )}
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={indefinite}
                  onChange={e => setIndefinite(e.target.checked)}
                  className="w-4 h-4 accent-white"
                />
                Indefinite
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit"
          className="rounded-xl bg-white px-6 py-2 text-black font-medium hover:bg-zinc-200">
          Create Allocation
        </button>
        <button type="button" onClick={() => router.push('/allocations')}
          className="rounded-xl bg-zinc-800 px-6 py-2 text-white hover:bg-zinc-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
