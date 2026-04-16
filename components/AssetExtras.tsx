'use client'

import Link from 'next/link'

type Person = { id: number; name: string; department: string | null }
type Allocation = { id: number; name: string; startDate: Date; endDate: Date | null; indefinite: boolean }
type MaintenanceRecord = {
  id: number
  title: string
  description: string | null
  status: string
  scheduledDate: Date | null
  completedDate: Date | null
  cost: number | null
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:     'bg-orange-950 text-orange-300',
  SCHEDULED:   'bg-blue-950 text-blue-300',
  IN_PROGRESS: 'bg-yellow-950 text-yellow-300',
  COMPLETED:   'bg-green-950 text-green-300',
  CANCELLED:   'bg-zinc-800 text-zinc-400',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:     'Pending',
  SCHEDULED:   'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
}

function fmt(date: Date | null) {
  return date ? new Date(date).toLocaleDateString('en-GB') : '—'
}

export default function AssetExtras({
  assignee,
  allocations,
  maintenance,
}: {
  assignee: Person | null
  allocations: Allocation[]
  maintenance: MaintenanceRecord[]
}) {
  const now = new Date()
  const upcoming = maintenance.filter(m => m.status === 'PENDING' || m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
  const history  = maintenance.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED')

  return (
    <div className="space-y-8 mt-8">

      {/* Assigned person */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Assigned To</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4">
          {assignee ? (
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/people/${assignee.id}`} className="font-medium hover:underline">
                  {assignee.name}
                </Link>
                {assignee.department && (
                  <p className="text-xs text-zinc-500 mt-0.5">{assignee.department}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">Not assigned to anyone.</p>
          )}
        </div>
      </div>

      {/* Allocations */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Allocations</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {allocations.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">Not in any allocations.</p>
          ) : (
            allocations.map(a => {
              const active = a.indefinite || !a.endDate || new Date(a.endDate) >= now
              return (
                <div key={a.id} className="flex items-center justify-between px-6 py-4 gap-4">
                  <div>
                    <Link href={`/allocations/${a.id}`} className="font-medium hover:underline">
                      {a.name}
                    </Link>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {fmt(a.startDate)} – {a.indefinite ? 'Indefinite' : fmt(a.endDate)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-950 text-green-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {active ? 'Active' : 'Ended'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Upcoming / active maintenance */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Upcoming Maintenance</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {upcoming.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">No upcoming maintenance.</p>
          ) : (
            upcoming.map(m => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.description && <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>}
                  <p className="text-xs text-zinc-500 mt-0.5">Scheduled: {fmt(m.scheduledDate)}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] ?? ''}`}>
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Maintenance history */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Maintenance History</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {history.length === 0 ? (
            <p className="px-6 py-4 text-zinc-400 text-sm">No maintenance history.</p>
          ) : (
            history.map(m => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4 gap-4">
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.description && <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>}
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Completed: {fmt(m.completedDate)}
                    {m.cost != null && ` · £${m.cost.toFixed(2)}`}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] ?? ''}`}>
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
