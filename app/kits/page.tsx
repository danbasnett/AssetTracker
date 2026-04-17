import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import Link from 'next/link'
import { Boxes } from 'lucide-react'
import CreateKitDialog from '../../components/CreateKitDialog'

export default async function KitsPage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const kits = await (prisma as any).kit.findMany({
    include: {
      container: { select: { id: true, name: true, assetTag: true } },
      items: { include: { asset: { select: { id: true, name: true, assetTag: true, status: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">Kits</h1>
            <p className="mt-1 text-zinc-400">{kits.length} kit{kits.length !== 1 ? 's' : ''}</p>
          </div>
          {canEdit && <CreateKitDialog />}
        </div>

        {kits.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
            <Boxes size={40} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-400">No kits yet.</p>
            <p className="text-zinc-600 text-sm mt-1">Click "Make Kit" to create your first kit.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kits.map((kit: any) => (
              <Link key={kit.id} href={`/kits/${kit.id}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors block">
                <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-white flex items-center gap-1.5 truncate">
                      <Boxes size={15} className="text-zinc-500 flex-shrink-0" />
                      {kit.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{kit.kitCode}</p>
                    {kit.container && (
                      <p className="text-xs text-zinc-600 mt-0.5">in {kit.container.name}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 flex-shrink-0 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {kit.items.length} item{kit.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {kit.items.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-zinc-600">Empty kit</p>
                  ) : (
                    kit.items.slice(0, 4).map((item: any) => (
                      <div key={item.assetId} className="px-4 py-2 flex items-center justify-between gap-2">
                        <span className="text-sm text-zinc-300 truncate">{item.asset.name}</span>
                        <span className="text-xs text-zinc-600 flex-shrink-0">{item.asset.assetTag}</span>
                      </div>
                    ))
                  )}
                  {kit.items.length > 4 && (
                    <p className="px-4 py-2 text-xs text-zinc-600">+{kit.items.length - 4} more</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
