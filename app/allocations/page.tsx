import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import Link from 'next/link'

export default async function AllocationsPage() {
  const session = await requireAuth()
  const canManage = hasRole(session.role, 'MANAGEMENT')

  const allocations = await prisma.allocation.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { assets: true } } }
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Allocations</h1>
            <p className="mt-1 text-zinc-400">{allocations.length} total allocations</p>
          </div>
          {canManage && (
            <Link href="/allocations/new"
              className="rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
              New Allocation
            </Link>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {allocations.length === 0 ? (
            <p className="p-6 text-zinc-400">No allocations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Start</th>
                  <th className="p-4 text-left">End</th>
                  <th className="p-4 text-left">Assets</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40">
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}
