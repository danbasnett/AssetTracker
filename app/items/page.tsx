import { prisma } from '../../lib/prisma'
import AddConsumableForm from '../../components/AddConsumableForm'
import ConsumableTable from '../../components/ConsumableTable'

export default async function ItemsPage() {
  const [consumables, locations] = await Promise.all([
    prisma.consumable.findMany({ orderBy: { name: 'asc' }, include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Consumables</h1>
        <p className="mt-1 text-zinc-400">{consumables.length} total consumables</p>

        <AddConsumableForm locations={locations} />

        <div className="mt-6">
          <ConsumableTable consumables={consumables} locations={locations} />
        </div>
      </div>
    </main>
  )
}
