import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LocationDetailEditor from '../../../components/LocationDetailEditor'

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [location, allLocations] = await Promise.all([
    (prisma.location as any).findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true,
        assets: { include: { location: true }, orderBy: { name: 'asc' } },
        consumables: { orderBy: { name: 'asc' } },
      },
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!location) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/locations" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Locations
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{location.name}</h1>
        {location.parent && (
          <p className="mt-1 text-zinc-400 text-sm">
            Under <Link href={`/locations/${location.parent.id}`} className="hover:underline">{location.parent.name}</Link>
          </p>
        )}

        <LocationDetailEditor location={location} allLocations={allLocations} canEdit={canEdit} />

        {/* Sub-locations */}
        {location.children.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Sub-locations</h2>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
              {location.children.map((child: any) => (
                <Link key={child.id} href={`/locations/${child.id}`}
                  className="flex items-center px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                  <span className="font-medium">{child.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Assets */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Assets <span className="text-zinc-600 normal-case font-normal">({location.assets.length})</span>
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {location.assets.length === 0 ? (
              <p className="px-6 py-4 text-zinc-400 text-sm">No assets at this location.</p>
            ) : (
              location.assets.map((asset: any) => (
                <Link key={asset.id} href={`/assets/${asset.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{asset.assetTag}</p>
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{asset.status}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Consumables */}
        <div className="mt-8">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
            Consumables <span className="text-zinc-600 normal-case font-normal">({location.consumables.length})</span>
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
            {location.consumables.length === 0 ? (
              <p className="px-6 py-4 text-zinc-400 text-sm">No consumables at this location.</p>
            ) : (
              location.consumables.map((c: any) => (
                <Link key={c.id} href={`/items/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                  <p className="font-medium">{c.name}</p>
                  <span className="text-sm text-zinc-400">{c.quantity} {c.unit}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
