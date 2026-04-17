'use client'

import { useActionState, useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { deleteLocations, updateLocation, reparentLocation } from '../app/actions'
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react'

type Location = {
  id: number
  name: string
  parentId: number | null
  parent: { name: string } | null
}

type TreeNode = Location & { children: TreeNode[] }

function buildTree(locations: Location[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  for (const l of locations) map.set(l.id, { ...l, children: [] })
  const roots: TreeNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId)!.children.push(node)
    else roots.push(node)
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name))
    nodes.forEach(n => sort(n.children))
    return nodes
  }
  return sort(roots)
}

function getDescendantIds(id: number, locations: Location[]): Set<number> {
  const result = new Set<number>()
  const queue = [id]
  while (queue.length) {
    const cur = queue.shift()!
    for (const l of locations) {
      if (l.parentId === cur && !result.has(l.id)) { result.add(l.id); queue.push(l.id) }
    }
  }
  return result
}

function ParentPicker({ value, onChange, locations, excludeId }: {
  value: string; onChange: (v: string) => void; locations: Location[]; excludeId: number
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const descendants = getDescendantIds(excludeId, locations)
  const options = locations.filter(l => l.id !== excludeId && !descendants.has(l.id))
  const filtered = options.filter(l => !q || l.name.toLowerCase().includes(q.toLowerCase()))
  const selected = options.find(l => String(l.id) === value)

  useEffect(() => {
    function down(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-lg bg-zinc-700 border border-zinc-600 px-3 py-1.5 text-sm text-left focus:outline-none hover:border-zinc-500">
        <span className={selected ? 'text-white' : 'text-zinc-400'}>{selected?.name ?? 'No parent'}</span>
        <ChevronDown size={12} className="text-zinc-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] rounded-lg border border-zinc-600 bg-zinc-800 shadow-xl">
          <div className="p-2 border-b border-zinc-700">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none" />
          </div>
          <div className="max-h-40 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setQ('') }}
              className="w-full px-3 py-1.5 text-xs text-left text-zinc-400 hover:bg-zinc-700 hover:text-white">No parent</button>
            {filtered.map(l => (
              <button key={l.id} type="button" onClick={() => { onChange(String(l.id)); setOpen(false); setQ('') }}
                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-zinc-700 ${String(l.id) === value ? 'text-white font-medium' : 'text-zinc-300'}`}>
                {l.name}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">No matches</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function EditRow({ location, locations, onDone }: { location: Location; locations: Location[]; onDone: () => void }) {
  const [name, setName] = useState(location.name)
  const [parentId, setParentId] = useState(location.parentId ? String(location.parentId) : '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const formData = new FormData()
    formData.append('id', String(location.id))
    formData.append('name', name)
    formData.append('parentId', parentId)
    setError(null)
    startTransition(async () => {
      const result = await updateLocation(null, formData)
      if ((result as any)?.error) setError((result as any).error)
      else onDone()
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-3 p-3 bg-zinc-800/60 rounded-xl mt-1">
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs text-zinc-400 mb-1 block">Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-lg bg-zinc-700 px-3 py-1.5 text-white border border-zinc-600 text-sm focus:outline-none focus:border-zinc-400" />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
      <div className="min-w-[160px]">
        <label className="text-xs text-zinc-400 mb-1 block">Parent</label>
        <ParentPicker value={parentId} onChange={setParentId} locations={locations} excludeId={location.id} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="rounded-lg bg-white px-3 py-1.5 text-black text-xs font-medium disabled:opacity-50">Save</button>
        <button type="button" onClick={onDone} className="rounded-lg bg-zinc-600 px-3 py-1.5 text-white text-xs">Cancel</button>
      </div>
    </div>
  )
}

// INDENT_PX must match the visual indent per depth level in the tree rows
const INDENT_PX = 20

// Given cursor X and the left edge of the name cell content area, compute target depth
function computeDropDepth(cursorX: number, nameCellContentX: number, maxDepth: number): number {
  const raw = Math.floor((cursorX - nameCellContentX) / INDENT_PX)
  return Math.max(0, Math.min(raw, maxDepth))
}

// Walk backwards from afterIndex to find the nearest node at depth-1
function resolveParent(
  flat: { node: TreeNode; depth: number }[],
  afterIndex: number,
  depth: number
): number | null {
  if (depth === 0) return null
  for (let i = afterIndex; i >= 0; i--) {
    if (flat[i].depth === depth - 1) return flat[i].node.id
  }
  return null
}

type DropTarget = { afterIndex: number; depth: number; half: 'top' | 'bottom' }

export default function LocationTable({ locations, canEdit }: { locations: Location[], canEdit: boolean }) {
  const [state, formAction] = useActionState(deleteLocations, null)
  const [selected, setSelected] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [dragging, setDragging] = useState<{ id: number; descendants: Set<number> } | null>(null)
  const draggingRef = useRef<{ id: number; descendants: Set<number> } | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const dropTargetRef = useRef<DropTarget | null>(null)
  const [dragError, setDragError] = useState<string | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const nameCellRef = useRef<HTMLTableCellElement | null>(null)
  const [, startTransition] = useTransition()

  const tree = buildTree(locations)

  const q = search.toLowerCase()
  function filterNode(node: TreeNode): TreeNode | null {
    if (!q) return node
    const filteredChildren = node.children.map(filterNode).filter(Boolean) as TreeNode[]
    if (node.name.toLowerCase().includes(q) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }
    return null
  }
  const filteredTree = tree.map(filterNode).filter(Boolean) as TreeNode[]

  function flatVisible(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] {
    const out: { node: TreeNode; depth: number }[] = []
    for (const n of nodes) {
      out.push({ node: n, depth })
      if (!collapsed.has(n.id)) out.push(...flatVisible(n.children, depth + 1))
    }
    return out
  }
  const flat = flatVisible(filteredTree)

  function toggle(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function toggleCollapse(id: number) {
    setCollapsed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleSubmit(e: React.FormEvent) {
    if (selected.length === 0) { e.preventDefault(); return }
    if (!confirm(`Delete ${selected.length} location(s)? This cannot be undone.`)) { e.preventDefault(); return }
    setSelected([])
  }

  function onDragStart(id: number) {
    const desc = getDescendantIds(id, locations)
    const info = { id, descendants: desc }
    draggingRef.current = info
    setDragging(info)
    setDropTarget(null)
    dropTargetRef.current = null
    setDragError(null)
  }

  function onRowDragOver(e: React.DragEvent<HTMLTableRowElement>, rowIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    const info = draggingRef.current
    if (!info) return

    const rowId = flat[rowIndex]?.node.id
    if (!rowId || rowId === info.id || info.descendants.has(rowId)) return

    // Determine top/bottom half of the row
    const rect = e.currentTarget.getBoundingClientRect()
    const half: 'top' | 'bottom' = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'

    // For depth: use left edge of the name cell content (first row's name cell as reference)
    // The name cell content starts after: indent of row + grip + chevron
    // We use the nameCellRef which is set on the first name cell
    const nameCellLeft = nameCellRef.current?.getBoundingClientRect().left ?? (tableRef.current?.getBoundingClientRect().left ?? 0) + 44

    const rowDepth = flat[rowIndex].depth
    // When dropping AFTER this row, max depth = rowDepth + 1 (nest inside it)
    // When dropping BEFORE, max depth = rowDepth (can't nest above)
    const maxDepth = half === 'bottom' ? rowDepth + 1 : rowDepth

    const depth = computeDropDepth(e.clientX, nameCellLeft, maxDepth)

    // Normalise: "top half of row N" == "bottom half of row N-1" for display
    let afterIndex = rowIndex
    if (half === 'top' && rowIndex > 0) {
      // Find the effective "after" position considering the previous row
      const prevDepth = flat[rowIndex - 1].depth
      const maxPrevDepth = prevDepth + 1
      const prevDepthAtCursor = computeDropDepth(e.clientX, nameCellLeft, maxPrevDepth)
      // Use bottom-of-previous unless current gives a shallower parent
      afterIndex = rowIndex - 1
      const next: DropTarget = { afterIndex, depth: Math.min(depth, prevDepthAtCursor), half: 'bottom' }
      if (dropTargetRef.current?.afterIndex !== next.afterIndex || dropTargetRef.current?.depth !== next.depth) {
        dropTargetRef.current = next
        setDropTarget(next)
      }
      return
    }

    const next: DropTarget = { afterIndex, depth, half }
    if (dropTargetRef.current?.afterIndex !== next.afterIndex || dropTargetRef.current?.depth !== next.depth) {
      dropTargetRef.current = next
      setDropTarget(next)
    }
  }

  function onDrop() {
    const info = draggingRef.current
    const target = dropTargetRef.current
    if (!info || !target) { cleanup(); return }

    const newParentId = resolveParent(flat, target.afterIndex, target.depth)
    const id = info.id
    cleanup()

    startTransition(async () => {
      const result = await reparentLocation(id, newParentId)
      if (result?.error) setDragError(result.error)
    })
  }

  function cleanup() {
    draggingRef.current = null
    dropTargetRef.current = null
    setDragging(null)
    setDropTarget(null)
  }

  // Compute the parent name for the drop target for the tooltip
  let dropParentName: string | null = null
  if (dropTarget) {
    const parentId = resolveParent(flat, dropTarget.afterIndex, dropTarget.depth)
    if (parentId) dropParentName = locations.find(l => l.id === parentId)?.name ?? null
    else dropParentName = null // root
  }

  const selectedCount = selected.filter(id => locations.some(l => l.id === id)).length

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      {(state?.error || dragError) && (
        <p className="text-red-400 text-sm mb-3">{state?.error || dragError}</p>
      )}

      {canEdit && selectedCount > 0 && (
        <div className="mb-3">
          <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-white font-medium">
            Delete {selectedCount} selected
          </button>
        </div>
      )}

      {selected.map(id => <input key={id} type="hidden" name="selectedIds" value={id} />)}

      <input type="search" placeholder="Search locations…" value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 text-sm" />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        {locations.length === 0 ? (
          <p className="p-6 text-zinc-400">No locations yet.</p>
        ) : (
          <table ref={tableRef} className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                {canEdit && <th className="p-3 w-8" />}
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Parent</th>
                {canEdit && <th className="p-3 w-20" />}
              </tr>
            </thead>
            <tbody
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
            >
              {flat.map(({ node, depth }, index) => {
                const isDragging = dragging?.id === node.id || dragging?.descendants.has(node.id)
                const isDropTarget = dropTarget?.afterIndex === index
                const hasChildren = node.children.length > 0
                const isCollapsed = collapsed.has(node.id)
                const lineIndent = isDropTarget && dropTarget ? dropTarget.depth * INDENT_PX + 10 : 0

                return (
                  <tr key={node.id}
                    className={`border-b border-zinc-800 last:border-0 group transition-colors relative
                      ${isDragging ? 'opacity-30' : 'hover:bg-zinc-800/30'}`}
                    draggable={canEdit}
                    onDragStart={() => onDragStart(node.id)}
                    onDragOver={e => onRowDragOver(e, index)}
                    onDragEnd={cleanup}
                  >
                    {canEdit && (
                      <td className="p-3 w-8">
                        <input type="checkbox" checked={selected.includes(node.id)}
                          onChange={() => toggle(node.id)}
                          className="w-4 h-4 accent-white align-middle" />
                      </td>
                    )}
                    <td
                      className="p-3 relative"
                      ref={index === 0 ? (el) => { nameCellRef.current = el } : undefined}
                    >
                      {/* Drop indicator: shown at bottom of this row */}
                      {isDropTarget && (
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 flex items-center"
                          style={{ paddingLeft: lineIndent }}>
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 -ml-1" />
                          <div className="flex-1 h-0.5 bg-blue-500" />
                        </div>
                      )}
                      <div className="flex items-center" style={{ paddingLeft: depth * INDENT_PX }}>
                        {canEdit && (
                          <span className="mr-1 text-zinc-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <GripVertical size={14} />
                          </span>
                        )}
                        <button type="button" onClick={() => hasChildren && toggleCollapse(node.id)}
                          className={`mr-1 flex-shrink-0 text-zinc-500 ${hasChildren ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}>
                          {hasChildren
                            ? isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />
                            : <span className="inline-block w-[14px]" />}
                        </button>
                        <Link href={`/locations/${node.id}`} className="hover:underline font-medium">{node.name}</Link>
                        {hasChildren && (
                          <span className="ml-2 text-xs text-zinc-500">
                            {node.children.length} sub-location{node.children.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">
                      {node.parent ? <span>{node.parent.name}</span> : <span className="text-zinc-600">—</span>}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <button type="button" onClick={() => setEditingId(node.id)}
                          className="rounded-lg bg-zinc-700 px-3 py-1 text-white text-xs hover:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drop target hint label */}
      {dragging && dropTarget && (
        <div className="mt-2 text-xs text-blue-400 text-center">
          {dropParentName
            ? <>Drop to nest inside <span className="font-semibold">{dropParentName}</span></>
            : <>Drop to make a top-level location</>
          }
        </div>
      )}

      {editingId !== null && (
        <div className="mt-3">
          {(() => {
            const loc = locations.find(l => l.id === editingId)
            if (!loc) return null
            return <EditRow location={loc} locations={locations} onDone={() => setEditingId(null)} />
          })()}
        </div>
      )}
    </form>
  )
}
