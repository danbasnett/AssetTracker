import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import { spawnDueRepeats } from '../../lib/spawnRepeats'
import MaintenanceTable from '../../components/MaintenanceTable'

export default async function MaintenancePage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  await spawnDueRepeats()

  const [records, assets] = await Promise.all([
    (prisma.maintenance as any).findMany({
      orderBy: { scheduledDate: 'asc' },
      select: {
        id: true, title: true, description: true, status: true,
        scheduledDate: true, completedDate: true, cost: true,
        repeatIntervalDays: true, repeatEndDate: true, parentId: true,
        asset: { select: { id: true, name: true, assetTag: true } },
      },
    }),
    prisma.asset.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, assetTag: true } }),
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Maintenance</h1>
        <p className="mt-1 text-zinc-400">{records.length} total records</p>

        <div className="mt-6">
          <MaintenanceTable records={records} assets={assets} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
