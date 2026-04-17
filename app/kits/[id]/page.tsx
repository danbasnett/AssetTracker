import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import KitDetail from '../../../components/KitDetail'

export default async function KitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [kit, allAssets] = await Promise.all([
    (prisma as any).kit.findUnique({
      where: { id: parseInt(id) },
      include: {
        container: { select: { id: true, name: true, assetTag: true, status: true } },
        items: {
          include: { asset: { select: { id: true, name: true, assetTag: true, status: true } } },
          orderBy: { asset: { name: 'asc' } },
        },
      },
    }),
    prisma.asset.findMany({
      select: { id: true, name: true, assetTag: true, status: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!kit) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/kits" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Kits
        </Link>
        <div className="mt-4">
          <KitDetail kit={kit} allAssets={allAssets} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
