import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '../../../components/NoteEditor'
import AssetDetailEditor from '../../../components/AssetDetailEditor'
import AssetExtras from '../../../components/AssetExtras'
import AssetPhotoGallery from '../../../components/AssetPhotoGallery'
import AssetTagPicker from '../../../components/AssetTagPicker'
import { updateAssetNotes } from '../../actions'

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')
  const canAdmin = hasRole(session.role, 'ADMIN')

  const [asset, locations, statuses, templates, allTags] = await Promise.all([
    (prisma.asset.findUnique as any)({
      where: { id: parseInt(id) },
      include: {
        location: true,
        assignee: { select: { id: true, name: true, department: true } },
        allocations: { orderBy: { startDate: 'desc' } },
        maintenance: { orderBy: { scheduledDate: 'desc' } },
        photos: { orderBy: { createdAt: 'asc' } },
        tags: { include: { tag: true } },
        kitItems: { include: { kit: { select: { id: true, name: true, kitCode: true } } } },
        containerFor: { select: { id: true, name: true, kitCode: true } },
      },
    }) as Promise<any>,
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).modelTemplate.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!asset) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/assets" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Assets
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{asset.name}</h1>
        <p className="mt-1 text-zinc-400">{asset.assetTag}</p>

        <AssetDetailEditor asset={asset as any} locations={locations} statuses={statuses} templates={templates} canEdit={canEdit} />
        <AssetTagPicker
          assetId={asset.id}
          allTags={allTags}
          currentTagIds={(asset.tags ?? []).map((at: any) => at.tagId)}
          canEdit={canEdit}
          canAdmin={canAdmin}
        />

        <NoteEditor
          initialNotes={asset.notes}
          canEdit={canEdit}
          onSave={async (notes) => {
            'use server'
            await updateAssetNotes(asset.id, notes)
          }}
        />

        <AssetPhotoGallery
          assetId={asset.id}
          initialPhotos={asset.photos ?? []}
          canEdit={canEdit}
        />

        {/* Kit memberships */}
        {((asset.kitItems?.length ?? 0) > 0 || (asset.containerFor?.length ?? 0) > 0) && (
          <div className="mt-6">
            {(asset.containerFor?.length ?? 0) > 0 && (
              <div className="mb-3">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Container for</p>
                <div className="flex flex-wrap gap-2">
                  {asset.containerFor.map((k: any) => (
                    <Link key={k.id} href={`/kits/${k.id}`}
                      className="text-sm text-zinc-300 hover:text-white hover:underline">
                      {k.name} <span className="text-zinc-600">({k.kitCode})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {(asset.kitItems?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">In kits</p>
                <div className="flex flex-wrap gap-2">
                  {asset.kitItems.map((ki: any) => (
                    <Link key={ki.kitId} href={`/kits/${ki.kitId}`}
                      className="text-sm text-zinc-300 hover:text-white hover:underline">
                      {ki.kit.name} <span className="text-zinc-600">({ki.kit.kitCode})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <AssetExtras
          assignee={asset.assignee}
          allocations={asset.allocations}
          maintenance={asset.maintenance}
        />
      </div>
    </main>
  )
}
