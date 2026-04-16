import { prisma } from '../lib/prisma'
import Link from 'next/link'

export default async function HomePage() {
  const [totalAssets, totalLocations, assetsByStatus, totalSKUs, consumableQuantity, allConsumables] = await Promise.all([
    prisma.asset.count(),
    prisma.location.count(),
    prisma.asset.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.consumable.count(),
    prisma.consumable.aggregate({ _sum: { quantity: true } }),
    prisma.consumable.findMany({ select: { quantity: true, reorderPoint: true } })
  ])

  const needsReorder = allConsumables.filter(c => c.quantity <= c.reorderPoint).length
  const totalConsumables = consumableQuantity._sum.quantity ?? 0

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Overview of your assets</p>

        <h2 className="mt-8 text-sm font-medium text-zinc-400 uppercase tracking-wider">Assets</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/assets" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-400">Total Assets</p>
            <p className="mt-2 text-3xl font-semibold">{totalAssets}</p>
          </Link>
          {['available', 'checked_out', 'repair', 'retired'].map(status => {
            const count = assetsByStatus.find(s => s.status === status)?._count.status ?? 0
            return (
              <Link key={status} href="/assets" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
                <p className="text-sm text-zinc-400 capitalize">{status.replace('_', ' ')}</p>
                <p className="mt-2 text-3xl font-semibold">{count}</p>
              </Link>
            )
          })}
        </div>

        <h2 className="mt-8 text-sm font-medium text-zinc-400 uppercase tracking-wider">Consumables</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/items" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-400">Total SKUs</p>
            <p className="mt-2 text-3xl font-semibold">{totalSKUs}</p>
          </Link>
          <Link href="/items" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-400">Total Quantity</p>
            <p className="mt-2 text-3xl font-semibold">{totalConsumables}</p>
          </Link>
          <Link href="/items" className={`rounded-2xl border p-5 transition-colors ${needsReorder > 0 ? 'border-yellow-800 bg-yellow-950 hover:border-yellow-600' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
            <p className="text-sm text-zinc-400">Needs Reordering</p>
            <p className={`mt-2 text-3xl font-semibold ${needsReorder > 0 ? 'text-yellow-400' : ''}`}>{needsReorder}</p>
          </Link>
        </div>

        <h2 className="mt-8 text-sm font-medium text-zinc-400 uppercase tracking-wider">Locations</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/locations" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors">
            <p className="text-sm text-zinc-400">Total Locations</p>
            <p className="mt-2 text-3xl font-semibold">{totalLocations}</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
