import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AllocationDetail from '../../../components/AllocationDetail'

export default async function AllocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canManage = hasRole(session.role, 'MANAGEMENT')

  const [allocation, allAssets] = await Promise.all([
    prisma.allocation.findUnique({
      where: { id: parseInt(id) },
      include: { assets: { include: { location: true }, orderBy: { name: 'asc' } } }
    }),
    prisma.asset.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!allocation) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/allocations" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Allocations
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">{allocation.name}</h1>
        <p className="mt-1 text-zinc-400">
          {new Date(allocation.startDate).toLocaleDateString('en-GB')}
          {' — '}
          {allocation.indefinite ? 'Indefinite' : allocation.endDate ? new Date(allocation.endDate).toLocaleDateString('en-GB') : 'No end date'}
        </p>

        <AllocationDetail allocation={allocation} allAssets={allAssets} canManage={canManage} />
      </div>
    </main>
  )
}
