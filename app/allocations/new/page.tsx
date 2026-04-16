import { requireRole } from '../../../lib/session'
import Link from 'next/link'
import NewAllocationForm from '../../../components/NewAllocationForm'

export default async function NewAllocationPage() {
  await requireRole('MANAGEMENT')
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/allocations" className="text-zinc-400 hover:text-white text-sm">
          ← Back to Allocations
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">New Allocation</h1>
        <NewAllocationForm />
      </div>
    </main>
  )
}
