'use client'

import { useState } from 'react'
import AllocationEditor from './AllocationEditor'

type Allocation = {
  id: number
  name: string
  startDate: string | Date
  endDate: string | Date | null
  indefinite: boolean
}

export default function AllocationDetailHeader({ allocation, canManage }: {
  allocation: Allocation
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="mt-4">
        <AllocationEditor allocation={allocation} onDone={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="mt-4 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{allocation.name}</h1>
        <p className="mt-1 text-zinc-400">
          {new Date(allocation.startDate).toLocaleDateString('en-GB')}
          {' — '}
          {allocation.indefinite
            ? <span className="text-blue-400">Indefinite</span>
            : allocation.endDate
              ? new Date(allocation.endDate).toLocaleDateString('en-GB')
              : 'No end date'}
        </p>
      </div>
      {canManage && (
        <button type="button" onClick={() => setEditing(true)}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-white text-sm font-medium hover:bg-zinc-700 flex-shrink-0">
          Edit
        </button>
      )}
    </div>
  )
}
