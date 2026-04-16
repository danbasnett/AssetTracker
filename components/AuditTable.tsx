'use client'

import { useState } from 'react'

type Log = {
  id: number
  createdAt: Date
  username: string
  action: string
  entity: string
  entityId: number | null
  entityName: string | null
  detail: string | null
}

const ACTION_STYLE: Record<string, string> = {
  CREATE:     'bg-green-950 text-green-300',
  UPDATE:     'bg-blue-950 text-blue-300',
  DELETE:     'bg-red-950 text-red-300',
  DELETE_ALL: 'bg-red-950 text-red-300',
  LOGIN:      'bg-zinc-800 text-zinc-300',
  LOGOUT:     'bg-zinc-800 text-zinc-400',
  IMPORT:     'bg-purple-950 text-purple-300',
  ASSIGN:     'bg-yellow-950 text-yellow-300',
  UNASSIGN:   'bg-orange-950 text-orange-300',
}

function DetailPanel({ detail }: { detail: string }) {
  let parsed: any = null
  try { parsed = JSON.parse(detail) } catch {}

  if (!parsed) return <pre className="text-xs text-zinc-400 whitespace-pre-wrap">{detail}</pre>

  // Mixed: top-level context keys + a nested changes diff
  if (parsed.changes && typeof parsed.changes === 'object' && Object.keys(parsed).some(k => k !== 'changes')) {
    const contextEntries = Object.entries(parsed).filter(([k]) => k !== 'changes')
    const changeEntries = Object.entries(parsed.changes as Record<string, { from: any; to: any }>)
    return (
      <div className="space-y-3">
        {contextEntries.length > 0 && (
          <table className="text-xs w-full border-collapse">
            <tbody>
              {contextEntries.filter(([, v]) => v !== null && v !== '').map(([key, val]) => (
                <tr key={key} className="border-t border-zinc-800">
                  <td className="pr-4 py-1 text-zinc-500 font-mono w-36">{key}</td>
                  <td className="py-1 text-zinc-300 font-mono">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {changeEntries.length > 0 && (
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="text-zinc-500">
                <th className="text-left pr-4 pb-1 font-medium">Field</th>
                <th className="text-left pr-4 pb-1 font-medium">From</th>
                <th className="text-left pb-1 font-medium">To</th>
              </tr>
            </thead>
            <tbody>
              {changeEntries.map(([key, { from, to }]) => (
                <tr key={key} className="border-t border-zinc-800">
                  <td className="pr-4 py-1 text-zinc-400 font-mono">{key}</td>
                  <td className="pr-4 py-1 text-red-400 font-mono">{String(from ?? '—')}</td>
                  <td className="py-1 text-green-400 font-mono">{String(to ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  // Render a diff (changes key only)
  if (parsed.changes && typeof parsed.changes === 'object') {
    const entries = Object.entries(parsed.changes as Record<string, { from: any; to: any }>)
    if (entries.length === 0) return <p className="text-xs text-zinc-500">No field changes detected</p>
    return (
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="text-zinc-500">
            <th className="text-left pr-4 pb-1 font-medium">Field</th>
            <th className="text-left pr-4 pb-1 font-medium">From</th>
            <th className="text-left pb-1 font-medium">To</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, { from, to }]) => (
            <tr key={key} className="border-t border-zinc-800">
              <td className="pr-4 py-1 text-zinc-400 font-mono">{key}</td>
              <td className="pr-4 py-1 text-red-400 font-mono">{String(from ?? '—')}</td>
              <td className="py-1 text-green-400 font-mono">{String(to ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // Render a bulk-update assets array with optional context keys
  if (parsed.assets && Array.isArray(parsed.assets)) {
    const contextEntries = Object.entries(parsed).filter(([k]) => k !== 'assets')
    return (
      <div className="space-y-3">
        {contextEntries.length > 0 && (
          <table className="text-xs w-full border-collapse">
            <tbody>
              {contextEntries.filter(([, v]) => v !== null && v !== '').map(([key, val]) => (
                <tr key={key} className="border-t border-zinc-800">
                  <td className="pr-4 py-1 text-zinc-500 font-mono w-36">{key}</td>
                  <td className="py-1 text-zinc-300 font-mono">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="text-xs text-zinc-400 space-y-1">
          {parsed.assets.map((item: any) => (
            <div key={item.id} className="font-mono">{item.name} <span className="text-zinc-600">({item.assetTag ?? `#${item.id}`})</span></div>
          ))}
        </div>
      </div>
    )
  }

  // Render a deleted array
  if (parsed.deleted && Array.isArray(parsed.deleted)) {
    return (
      <div className="text-xs text-zinc-400 space-y-1">
        {parsed.deleted.map((item: any) => (
          <div key={item.id} className="font-mono">{item.name} <span className="text-zinc-600">({item.assetTag ?? `#${item.id}`})</span></div>
        ))}
      </div>
    )
  }

  // Generic: render all key-value pairs
  return (
    <table className="text-xs w-full border-collapse">
      <tbody>
        {Object.entries(parsed).filter(([, v]) => v !== null && v !== '').map(([key, val]) => (
          <tr key={key} className="border-t border-zinc-800">
            <td className="pr-4 py-1 text-zinc-500 font-mono w-36">{key}</td>
            <td className="py-1 text-zinc-300 font-mono">{String(val)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function LogRow({ log }: { log: Log }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = !!log.detail

  return (
    <>
      <tr
        className={`border-b border-zinc-800 ${hasDetail ? 'cursor-pointer hover:bg-zinc-800/40' : ''} ${expanded ? 'bg-zinc-800/40' : ''}`}
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        <td className="p-4 text-zinc-500 whitespace-nowrap text-xs">
          {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </td>
        <td className="p-4 text-zinc-300 whitespace-nowrap">{log.username}</td>
        <td className="p-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_STYLE[log.action] ?? 'bg-zinc-800 text-zinc-300'}`}>
            {log.action}
          </span>
        </td>
        <td className="p-4 text-zinc-400">{log.entity}</td>
        <td className="p-4">{log.entityName ?? (log.entityId ? `#${log.entityId}` : '—')}</td>
        <td className="p-4 text-zinc-500 text-xs">
          {hasDetail ? (
            <span className={`text-zinc-400 ${expanded ? 'rotate-90' : ''} inline-block transition-transform`}>▶</span>
          ) : '—'}
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr className="border-b border-zinc-800 bg-zinc-900">
          <td colSpan={6} className="px-6 py-4">
            <DetailPanel detail={log.detail!} />
          </td>
        </tr>
      )}
    </>
  )
}

export default function AuditTable({ logs }: { logs: Log[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const actions = [...new Set(logs.map(l => l.action))].sort()
  const entities = [...new Set(logs.map(l => l.entity))].sort()

  const filtered = logs.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false
    if (entityFilter && l.entity !== entityFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        l.username.toLowerCase().includes(s) ||
        l.entity.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        (l.entityName ?? '').toLowerCase().includes(s) ||
        (l.detail ?? '').toLowerCase().includes(s)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="flex-1 min-w-40 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
        />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
          <option value="">All actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
          className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white border border-zinc-700 focus:outline-none focus:border-zinc-500">
          <option value="">All entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <p className="text-xs text-zinc-500">{filtered.length} event{filtered.length !== 1 ? 's' : ''} — click a row to expand detail</p>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-zinc-400 text-sm">No events found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-left">
                <th className="p-4 whitespace-nowrap">Time</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Name / ID</th>
                <th className="p-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => <LogRow key={log.id} log={log} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
