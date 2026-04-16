import AssetTable from '../../components/AssetTable'
import AddAssetForm from '../../components/AddAssetForm'
import { prisma } from '../../lib/prisma'
import SearchBar from '../../components/SearchBar'

export default async function AssetsPage() {
  const [assets, locations] = await Promise.all([
    prisma.asset.findMany({ include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Item</h1>
      </div>
    </main>
  )
}
