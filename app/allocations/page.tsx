import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import Link from 'next/link'
import AllocationTable from '../../components/AllocationTable'

export default async function AllocationsPage() {
  const session = await requireAuth()
  const canManage = hasRole(session.role, 'MANAGEMENT')

  const allocations = await prisma.allocation.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { assets: true } } }
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Allocations</h1>
            <p className="mt-1 text-zinc-400">{allocations.length} total allocations</p>
          </div>
          {canManage && (
            <Link href="/allocations/new"
              className="self-start sm:self-auto rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
              New Allocation
            </Link>
          )}
        </div>

        <div className="mt-6">
          <AllocationTable allocations={allocations} canManage={canManage} />
        </div>
      </div>
    </main>
  )
}
