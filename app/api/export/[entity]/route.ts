import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '../../../../lib/session'
import { prisma } from '../../../../lib/prisma'

function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB')
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  try { await requireRole('ADMIN') } catch { return new NextResponse('Unauthorized', { status: 401 }) }

  const { entity } = await params
  let csv = ''
  let filename = entity

  if (entity === 'assets') {
    const rows = await prisma.asset.findMany({
      orderBy: { name: 'asc' },
      include: { location: true },
    })
    csv = toCSV(rows.map(r => ({
      name: r.name,
      assetTag: r.assetTag,
      status: r.status,
      location: r.location?.name ?? '',
      serialNumber: r.serialNumber ?? '',
      modelNumber: r.modelNumber ?? '',
      supplier: r.supplier ?? '',
      purchaseDate: fmtDate(r.purchaseDate),
      value: r.value ?? '',
      notes: (r as any).notes ?? '',
    })))

  } else if (entity === 'locations') {
    const rows = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: { parent: true },
    })
    csv = toCSV(rows.map(r => ({
      name: r.name,
      parent: r.parent?.name ?? '',
      address: (r as any).address ?? '',
      notes: (r as any).notes ?? '',
    })))

  } else if (entity === 'consumables') {
    const rows = await prisma.consumable.findMany({
      orderBy: { name: 'asc' },
      include: { location: true },
    })
    csv = toCSV(rows.map(r => ({
      name: r.name,
      quantity: r.quantity,
      unit: r.unit,
      reorderPoint: r.reorderPoint,
      modelNumber: r.modelNumber ?? '',
      location: r.location?.name ?? '',
      notes: (r as any).notes ?? '',
    })))

  } else if (entity === 'people') {
    const rows = await prisma.person.findMany({
      orderBy: { name: 'asc' },
    })
    csv = toCSV(rows.map(r => ({
      name: r.name,
      email: r.email ?? '',
      department: r.department ?? '',
    })))

  } else if (entity === 'allocations') {
    const rows = await prisma.allocation.findMany({
      orderBy: { name: 'asc' },
      include: { assets: { select: { name: true, assetTag: true } } },
    })
    csv = toCSV(rows.map(r => ({
      name: r.name,
      startDate: fmtDate(r.startDate),
      endDate: r.indefinite ? 'indefinite' : fmtDate(r.endDate),
      assets: r.assets.map(a => `${a.name} (${a.assetTag})`).join('; '),
    })))

  } else if (entity === 'maintenance') {
    const rows = await (prisma.maintenance as any).findMany({
      orderBy: { scheduledDate: 'asc' },
      include: { asset: { select: { name: true, assetTag: true } } },
    })
    csv = toCSV(rows.map((r: any) => ({
      title: r.title,
      asset: r.asset?.name ?? '',
      assetTag: r.asset?.assetTag ?? '',
      status: r.status,
      scheduledDate: fmtDate(r.scheduledDate),
      completedDate: fmtDate(r.completedDate),
      cost: r.cost ?? '',
      description: r.description ?? '',
    })))

  } else {
    return new NextResponse('Unknown entity', { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-export.csv"`,
    },
  })
}
