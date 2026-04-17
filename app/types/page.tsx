import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../lib/session'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

export default async function TypesPage() {
  await requireAuth()

  const assets = await (prisma.asset.findMany as any)({
    select: { id: true, type: true, status: true },
  })

  // Group by type
  const typeMap: Record<string, { total: number; byStatus: Record<string, number> }> = {}
  for (const a of assets) {
    const t = (a.type as string) || ''
    if (!typeMap[t]) typeMap[t] = { total: 0, byStatus: {} }
    typeMap[t].total++
    typeMap[t].byStatus[a.status] = (typeMap[t].byStatus[a.status] ?? 0) + 1
  }

  const rows = Object.entries(typeMap)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => {
      if (!a.type) return 1
      if (!b.type) return -1
      return a.type.localeCompare(b.type)
    })

  const allStatuses = [...new Set(assets.map((a: any) => a.status as string))].sort() as string[]

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold">Asset Types</h1>
        <p className="mt-1 text-zinc-400 mb-8">{rows.filter(r => r.type).length} types across {assets.length} assets</p>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                {allStatuses.map(s => (
                  <th key={s} className="px-4 py-3 font-medium text-right text-zinc-500">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.type || '__unset__'} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-6 py-4">
                    {row.type ? (
                      <Link
                        href={`/assets?type=${encodeURIComponent(row.type)}`}
                        className="font-medium hover:underline"
                      >
                        {row.type}
                      </Link>
                    ) : (
                      <span className="text-zinc-500 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{row.total}</td>
                  {allStatuses.map(s => (
                    <td key={s} className="px-4 py-4 text-right text-zinc-400">
                      {row.byStatus[s] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
