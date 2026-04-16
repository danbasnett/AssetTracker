import { prisma } from '../../lib/prisma'
import { requireRole } from '../../lib/session'
import AuditTable from '../../components/AuditTable'

export default async function AuditPage() {
  await requireRole('ADMIN')

  const logs = await (prisma.auditLog as any).findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">Audit History</h1>
        <p className="mt-1 text-zinc-400">Last 500 events</p>

        <div className="mt-6">
          <AuditTable logs={logs} />
        </div>
      </div>
    </main>
  )
}
