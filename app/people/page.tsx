import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import Link from 'next/link'
import PeopleTable from '../../components/PeopleTable'

export default async function PeoplePage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const people = await prisma.person.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { assets: true } } },
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">People</h1>
        <p className="mt-1 text-zinc-400">{people.length} total people</p>

        <div className="mt-6">
          <PeopleTable people={people} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
