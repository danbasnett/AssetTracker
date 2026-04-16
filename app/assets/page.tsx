import AssetTable from '../../components/AssetTable'
import { prisma } from '../../lib/prisma'
import Link from 'next/link'

export default async function AssetsPage() {
  const [assets, locations] = await Promise.all([
    prisma.asset.findMany({ include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Assets</h1>
            <p className="mt-1 text-zinc-400">{assets.length} total assets</p>
          </div>
          <Link href="/assets/new"
            className="rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-zinc-200">
            Add Asset
          </Link>
        </div>

        <div className="mt-6">
          <AssetTable assets={assets} locations={locations} />
        </div>
      </div>
    </main>
  )
}
