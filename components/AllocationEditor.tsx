'use client'

import { useState, useTransition } from 'react'
import { updateAllocation } from '../app/actions'
import DatePicker from './DatePicker'

type Allocation = {
  id: number
  name: string
  startDate: string | Date
  endDate: string | Date | null
  indefinite: boolean
}

export default function AllocationEditor({ allocation, onDone }: {
  allocation: Allocation
  onDone?: () => void
}) {
  const toYMD = (d: string | Date | null) =>
    d ? new Date(d).toISOString().split('T')[0] : ''

  const [name, setName] = useState(allocation.name)
  const [startDate, setStartDate] = useState(toYMD(allocation.startDate))
  const [endDate, setEndDate] = useState(toYMD(allocation.endDate))
  const [indefinite, setIndefinite] = useState(allocation.indefinite)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save() {
    const formData = new FormData()
    formData.set('id', String(allocation.id))
    formData.set('name', name)
    formData.set('startDate', startDate)
    formData.set('endDate', endDate)
    formData.set('indefinite', String(indefinite))
    startTransition(async () => {
      const result = await updateAllocation(null, formData)
      if (result?.error) { setError(result.error); return }
      onDone?.()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-xl bg-zinc-800 px-3 py-2 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-zinc-400 mb-1 block">Start Date</label>
          <DatePicker value={startDate} onChange={setStartDate} className="w-full" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-zinc-400 mb-1 block">End Date</label>
          {!indefinite
            ? <DatePicker value={endDate} onChange={setEndDate} className="w-full" />
            : <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-blue-400 text-sm">Indefinite</div>
          }
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
        <input type="checkbox" checked={indefinite} onChange={e => setIndefinite(e.target.checked)}
          className="w-4 h-4 accent-white" />
        No end date (indefinite)
      </label>
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={save} disabled={isPending}
          className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200 disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {onDone && (
          <button type="button" onClick={onDone}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-zinc-300 text-sm hover:bg-zinc-700">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
