import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/session'
import ModelTemplateList from '../../components/ModelTemplateList'
export const dynamic = 'force-dynamic'

export default async function ModelsPage() {
  await requireAuth()
  const [templates, locations] = await Promise.all([
    (prisma as any).modelTemplate.findMany({ include: { location: true }, orderBy: { name: 'asc' } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Model Templates</h1>
        <p className="mt-1 text-zinc-400 mb-8">Define reusable asset templates to speed up adding new assets.</p>
        <ModelTemplateList templates={templates} locations={locations} />
      </div>
    </main>
  )
}
