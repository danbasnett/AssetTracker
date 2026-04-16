import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '../../../components/NoteEditor'
import ConsumableDetailEditor from '../../../components/ConsumableDetailEditor'
import { updateConsumableNotes } from '../../actions'

export default async function ConsumableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [item, locations] = await Promise.all([
    prisma.consumable.findUnique({ where: { id: parseInt(id) }, include: { location: true } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!item) notFound()

  const isLow = item.quantity > 0 && item.quantity <= item.reorderPoint
  const isEmpty = item.quantity === 0

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/items" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Consumables
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{item.name}</h1>
        {isEmpty && <p className="mt-1 text-red-400 text-sm">Out of stock</p>}
        {isLow && <p className="mt-1 text-yellow-400 text-sm">Low stock</p>}

        <ConsumableDetailEditor item={item} locations={locations} canEdit={canEdit} />

        <NoteEditor
          initialNotes={item.notes}
          canEdit={canEdit}
          onSave={async (notes) => {
            'use server'
            await updateConsumableNotes(item.id, notes)
          }}
        />
      </div>
    </main>
  )
}
