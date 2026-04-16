import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '../../../components/NoteEditor'
import AssetDetailEditor from '../../../components/AssetDetailEditor'
import AssetExtras from '../../../components/AssetExtras'
import { updateAssetNotes } from '../../actions'

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [asset, locations, statuses] = await Promise.all([
    (prisma.asset.findUnique as any)({
      where: { id: parseInt(id) },
      include: {
        location: true,
        assignee: { select: { id: true, name: true, department: true } },
        allocations: { orderBy: { startDate: 'desc' } },
        maintenance: { orderBy: { scheduledDate: 'desc' } },
      },
    }) as Promise<any>,
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!asset) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/assets" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Assets
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{asset.name}</h1>
        <p className="mt-1 text-zinc-400">{asset.assetTag}</p>

        <AssetDetailEditor asset={asset as any} locations={locations} statuses={statuses} canEdit={canEdit} />

        <NoteEditor
          initialNotes={asset.notes}
          canEdit={canEdit}
          onSave={async (notes) => {
            'use server'
            await updateAssetNotes(asset.id, notes)
          }}
        />

        <AssetExtras
          assignee={asset.assignee}
          allocations={asset.allocations}
          maintenance={asset.maintenance}
        />
      </div>
    </main>
  )
}
