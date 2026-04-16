import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import ConsumableTable from '../../components/ConsumableTable'
import Link from 'next/link'

export default async function ItemsPage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [consumables, locations] = await Promise.all([
    prisma.consumable.findMany({ orderBy: { name: 'asc' }, include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Consumables</h1>
            <p className="mt-1 text-zinc-400">{consumables.length} total consumables</p>
          </div>
          {canEdit && (
            <Link href="/items/new"
              className="rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
              Add Consumable
            </Link>
          )}
        </div>

        <div className="mt-6">
          <ConsumableTable consumables={consumables} locations={locations} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
