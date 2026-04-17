'use client'

import { useActionState, useTransition, useState } from 'react'
import { createPerson, deletePerson } from '../app/actions'
import Link from 'next/link'
import { SortIcon, sortRows, thCls, type SortDir } from './SortableHeader'

type Person = {
  id: number
  name: string
  email: string | null
  department: string | null
  _count: { assets: number }
}

export default function PeopleTable({ people, canEdit }: { people: Person[]; canEdit: boolean }) {
  const [createState, createAction] = useActionState(createPerson, null)
  const [, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [search, setSearch] = useState('')

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = sortRows(
    people
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.department ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.email ?? '').toLowerCase().includes(search.toLowerCase()))
      .map(p => ({ ...p, assets: p._count.assets })),
    sortKey, sortDir
  )

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name}? Their assets will be unassigned.`)) return
    setDeletingId(id)
    const formData = new FormData()
    formData.append('id', String(id))
    startTransition(async () => {
      await deletePerson(null, formData)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <input type="search" placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {people.length === 0 ? (
          <p className="p-6 text-zinc-400">No people added yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className={thCls} onClick={() => toggleSort('name')}>Name <SortIcon active={sortKey==='name'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('department')}>Department <SortIcon active={sortKey==='department'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('email')}>Email <SortIcon active={sortKey==='email'} dir={sortDir} /></th>
                <th className={thCls} onClick={() => toggleSort('assets')}>Assets <SortIcon active={sortKey==='assets'} dir={sortDir} /></th>
                {canEdit && <th className="p-4 text-left"></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(person => (
                <tr key={person.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40">
                  <td className="p-4">
                    <Link href={`/people/${person.id}`} className="font-medium hover:underline">
                      {person.name}
                    </Link>
                  </td>
                  <td className="p-4 text-zinc-400">{person.department ?? '—'}</td>
                  <td className="p-4 text-zinc-400">{person.email ?? '—'}</td>
                  <td className="p-4 text-zinc-400">{person._count.assets}</td>
                  {canEdit && (
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(person.id, person.name)}
                        disabled={deletingId === person.id}
                        className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300 disabled:opacity-50">
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {canEdit && (
        <form action={createAction} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Add Person</h3>
          <div className="flex flex-wrap gap-2">
            <input name="name" placeholder="Full name" required
              className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-44" />
            <input name="department" placeholder="Department"
              className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-40" />
            <input name="email" type="email" placeholder="Email"
              className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-52" />
            <button type="submit"
              className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
              Add
            </button>
          </div>
          {createState?.error && <p className="text-red-400 text-sm">{createState.error}</p>}
          {createState?.success && <p className="text-green-400 text-sm">Person added</p>}
        </form>
      )}
    </div>
  )
}
