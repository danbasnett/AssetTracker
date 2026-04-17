'use client'

import { useState } from 'react'
import Link from 'next/link'
import AllocationEditor from './AllocationEditor'

type Allocation = {
  id: number
  name: string
  startDate: string | Date
  endDate: string | Date | null
  indefinite: boolean
  _count: { assets: number }
}

export default function AllocationTable({ allocations, canManage }: {
  allocations: Allocation[]
  canManage: boolean
}) {
  const [editingId, setEditingId] = useState<number | null>(null)

  if (allocations.length === 0) {
    return <p className="p-6 text-zinc-400">No allocations yet.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-800 text-zinc-400">
          <th className="p-4 text-left">Name</th>
          <th className="p-4 text-left">Start</th>
          <th className="p-4 text-left">End</th>
          <th className="p-4 text-left">Assets</th>
          {canManage && <th className="p-4 text-left" />}
        </tr>
      </thead>
      <tbody>
        {allocations.map(a => (
          <tr key={a.id} className="border-b border-zinc-800 last:border-0">
            {editingId === a.id ? (
              <td colSpan={canManage ? 5 : 4} className="p-4">
                <AllocationEditor
                  allocation={a}
                  onDone={() => setEditingId(null)}
                />
              </td>
            ) : (
              <>
                <td className="p-4">
                  <Link href={`/allocations/${a.id}`} className="hover:underline font-medium">
                    {a.name}
                  </Link>
                </td>
                <td className="p-4 text-zinc-400">
                  {new Date(a.startDate).toLocaleDateString('en-GB')}
                </td>
                <td className="p-4 text-zinc-400">
                  {a.indefinite ? (
                    <span className="text-blue-400">Indefinite</span>
                  ) : a.endDate ? (
                    new Date(a.endDate).toLocaleDateString('en-GB')
                  ) : '—'}
                </td>
                <td className="p-4 text-zinc-400">{a._count.assets}</td>
                {canManage && (
                  <td className="p-4">
                    <button type="button" onClick={() => setEditingId(a.id)}
                      className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600">
                      Edit
                    </button>
                  </td>
                )}
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
