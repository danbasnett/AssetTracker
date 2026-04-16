import { prisma } from '../../lib/prisma'
import { requireAuth, hasRole } from '../../lib/session'
import LocationTable from '../../components/LocationTable'
import AddLocationForm from '../../components/AddLocationForm'

export default async function LocationsPage() {
  const session = await requireAuth()
  const canEdit = hasRole(session.role, 'ASSET_CONTROL')

  const locations = await prisma.location.findMany({
    include: { parent: true }
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold">Locations</h1>
        <p className="mt-1 text-zinc-400">{locations.length} total locations</p>

        {canEdit && <AddLocationForm locations={locations} />}

        <div className="mt-6">
          <LocationTable locations={locations} canEdit={canEdit} />
        </div>
      </div>
    </main>
  )
}
