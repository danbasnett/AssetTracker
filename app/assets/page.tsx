import AssetTable from '../../components/AssetTable'
import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import Link from 'next/link'

export default async function AssetsPage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')
  const canAdmin = hasRole(session.role, 'ADMIN')

  const [assets, locations, statuses, templates, allTags] = await Promise.all([
    (prisma.asset.findMany as any)({ include: { location: true, tags: { include: { tag: true } } } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).modelTemplate.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Assets</h1>
            <p className="mt-1 text-zinc-400">{assets.length} total assets</p>
          </div>
          {canEdit && (
            <Link href="/assets/new"
              className="self-start sm:self-auto rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
              Add Asset
            </Link>
          )}
        </div>

        <div className="mt-6">
          <AssetTable assets={assets} locations={locations} statuses={statuses} templates={templates} allTags={allTags} canEdit={canEdit} canAdmin={canAdmin} />
        </div>
      </div>
    </main>
  )
}
