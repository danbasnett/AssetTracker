import { prisma } from '../../../lib/prisma'
import Link from 'next/link'
import NewAssetForm from '../../../components/NewAssetForm'

export default async function NewAssetPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/assets" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Assets
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Add Asset</h1>
        <NewAssetForm locations={locations} />
      </div>
    </main>
  )
}
