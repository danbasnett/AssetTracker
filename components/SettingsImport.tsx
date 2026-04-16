'use client'

import { useActionState, useState } from 'react'
import { importAssets, importConsumables, importLocations, importPeople } from '../app/actions'

type ImportResult = { success?: boolean; error?: string; imported?: number; skipped?: number; errors?: string[] } | null

function ImportSection({
  label,
  entity,
  action,
}: {
  label: string
  entity: string
  action: (prevState: any, formData: FormData) => Promise<ImportResult>
}) {
  const [state, formAction] = useActionState(action, null)
  const [filename, setFilename] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <a
          href={`/api/templates/${entity}`}
          download
          className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
        >
          Download template
        </a>
      </div>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-700">
          {filename ?? 'Choose CSV'}
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            onChange={e => setFilename(e.target.files?.[0]?.name ?? null)}
            className="sr-only"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200"
        >
          Import
        </button>
      </form>

      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
      {state?.success && (
        <div className="space-y-1">
          <p className="text-green-400 text-sm">
            Imported {state.imported} row{state.imported !== 1 ? 's' : ''}
            {state.skipped ? `, skipped ${state.skipped}` : ''}
          </p>
          {state.errors && state.errors.length > 0 && (
            <details className="text-xs text-red-400">
              <summary className="cursor-pointer">{state.errors.length} row error{state.errors.length !== 1 ? 's' : ''}</summary>
              <ul className="mt-1 space-y-0.5 pl-3 list-disc">
                {state.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default function SettingsImport() {
  return (
    <div className="space-y-3">
      <ImportSection label="Assets" entity="assets" action={importAssets} />
      <ImportSection label="Consumables" entity="consumables" action={importConsumables} />
      <ImportSection label="Locations" entity="locations" action={importLocations} />
      <ImportSection label="People" entity="people" action={importPeople} />
    </div>
  )
}
