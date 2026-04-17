import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AllocationDetail from '../../../components/AllocationDetail'
import AllocationDetailHeader from '../../../components/AllocationDetailHeader'

export default async function AllocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canManage = hasRole(session.role, 'MANAGEMENT')

  const [allocation, allAssets, templates, allKits] = await Promise.all([
    (prisma as any).allocation.findUnique({
      where: { id: parseInt(id) },
      include: {
        assets: { include: { location: true }, orderBy: { name: 'asc' } },
        planItems: {
          orderBy: { createdAt: 'asc' },
          include: { kit: { include: { items: { include: { asset: { select: { id: true } } } } } } },
        },
      }
    }),
    prisma.asset.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).modelTemplate.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).kit.findMany({
      orderBy: { name: 'asc' },
      include: { items: { include: { asset: { select: { id: true, name: true, assetTag: true } } } } },
    }),
  ])

  if (!allocation) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/allocations" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Allocations
        </Link>
        <AllocationDetailHeader allocation={allocation} canManage={canManage} />

        <AllocationDetail allocation={allocation} allAssets={allAssets} canManage={canManage} templates={templates} allKits={allKits} />
      </div>
    </main>
  )
}
