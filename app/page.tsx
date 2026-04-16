import { prisma } from '../lib/prisma'

export default async function HomePage() {
  const [totalAssets, totalLocations, assetsByStatus] = await Promise.all([
    prisma.asset.count(),
    prisma.location.count(),
    prisma.asset.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Overview of your assets</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total Assets</p>
            <p className="mt-2 text-3xl font-semibold">{totalAssets}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total Locations</p>
            <p className="mt-2 text-3xl font-semibold">{totalLocations}</p>
          </div>

          {['available', 'checked_out', 'repair', 'retired'].map(status => {
            const count = assetsByStatus.find(s => s.status === status)?._count.status ?? 0
            return (
              <div key={status} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400 capitalize">{status.replace('_', ' ')}</p>
                <p className="mt-2 text-3xl font-semibold">{count}</p>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
