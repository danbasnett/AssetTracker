import { prisma } from '../../../lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NoteEditor from '../../../components/NoteEditor'
import AssetDetailEditor from '../../../components/AssetDetailEditor'
import { updateAssetNotes } from '../../actions'

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [asset, locations] = await Promise.all([
    prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: { location: true }
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } })
  ])

  if (!asset) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/assets" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Assets
        </Link>

        <h1 className="mt-4 text-3xl font-semibold">{asset.name}</h1>
        <p className="mt-1 text-zinc-400">{asset.assetTag}</p>

        <AssetDetailEditor asset={asset} locations={locations} />

        <NoteEditor
          initialNotes={asset.notes}
          onSave={async (notes) => {
            'use server'
            await updateAssetNotes(asset.id, notes)
          }}
        />
      </div>
    </main>
  )
}
