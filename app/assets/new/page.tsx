import { prisma } from '../../../lib/prisma'
import { requireRole } from '../../../lib/session'
import Link from 'next/link'
import NewAssetForm from '../../../components/NewAssetForm'

export default async function NewAssetPage() {
  await requireRole('ASSET_CONTROL')
  const [locations, statuses, templates] = await Promise.all([
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.status.findMany({ orderBy: { name: 'asc' } }),
    (prisma as any).modelTemplate.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/assets" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Assets
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Add Asset</h1>
        <NewAssetForm locations={locations} statuses={statuses} templates={templates} />
      </div>
    </main>
  )
}
