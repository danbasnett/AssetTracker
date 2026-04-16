import { prisma } from '../../../lib/prisma'
import { requireAuth, hasRole } from '../../../lib/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PersonDetail from '../../../components/PersonDetail'

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const [person, unassignedAssets] = await Promise.all([
    prisma.person.findUnique({
      where: { id: parseInt(id) },
      include: { assets: { include: { location: true }, orderBy: { name: 'asc' } } },
    }),
    prisma.asset.findMany({
      where: { assigneeId: null },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!person) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/people" className="text-zinc-400 hover:text-white text-sm">
          ← Back to People
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">{person.name}</h1>
        {person.department && (
          <p className="mt-1 text-zinc-400">{person.department}</p>
        )}
        {person.email && (
          <p className="text-zinc-500 text-sm">{person.email}</p>
        )}

        <PersonDetail person={person} unassignedAssets={unassignedAssets} canEdit={canEdit} />
      </div>
    </main>
  )
}
