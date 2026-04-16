import { prisma } from '../../../lib/prisma'
import { requireRole } from '../../../lib/session'
import Link from 'next/link'
import NewConsumableForm from '../../../components/NewConsumableForm'

export default async function NewConsumablePage() {
  await requireRole('ASSET_CONTROL')
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/items" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Consumables
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Add Consumable</h1>
        <NewConsumableForm locations={locations} />
      </div>
    </main>
  )
}
