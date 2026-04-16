import AssetTable from '../../components/AssetTable'
import AddAssetForm from '../../components/AddAssetForm'
import { prisma } from '../../lib/prisma'

export default async function AssetsPage() {
  const [assets, locations] = await Promise.all([
    prisma.asset.findMany({ include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ]) 

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Assets</h1>
        <p className="mt-1 text-zinc-400">{assets.length} total assets</p>

        <AddAssetForm locations={locations} />

        <div className="mt-6">
	  <AssetTable assets={assets} locations={locations} />
	</div>
      </div>
    </main>
  )
}
