'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

const ENTITIES = [
  { key: 'assets',       label: 'Assets' },
  { key: 'locations',    label: 'Locations' },
  { key: 'consumables',  label: 'Consumables' },
  { key: 'people',       label: 'People' },
  { key: 'allocations',  label: 'Allocations' },
  { key: 'maintenance',  label: 'Maintenance' },
]

export default function SettingsExport() {
  const [active, setActive] = useState('assets')

  const entity = ENTITIES.find(e => e.key === active)!

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-zinc-800">
        {ENTITIES.map(e => (
          <button
            key={e.key}
            onClick={() => setActive(e.key)}
            className={`px-4 py-3 text-sm whitespace-nowrap shrink-0 transition-colors ${
              active === e.key
                ? 'text-white border-b-2 border-white -mb-px font-medium'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 flex items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">
          Download all <span className="text-white">{entity.label}</span> as a CSV file.
        </p>
        <a
          href={`/api/export/${active}`}
          download={`${active}-export.csv`}
          className="flex items-center gap-2 rounded-xl bg-white text-black text-sm font-medium px-4 py-2 hover:bg-zinc-200 transition-colors shrink-0"
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>
    </div>
  )
}
