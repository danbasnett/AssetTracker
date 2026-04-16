export type SortDir = 'asc' | 'desc'

export function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-zinc-600 text-xs">↕</span>
  return <span className="ml-1 text-xs">{dir === 'asc' ? '↑' : '↓'}</span>
}

export function sortRows<T>(rows: T[], key: keyof T | string, dir: SortDir): T[] {
  return [...rows].sort((a: any, b: any) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    return dir === 'asc' ? cmp : -cmp
  })
}

export const thCls = 'p-4 text-left cursor-pointer select-none hover:text-white transition-colors'
