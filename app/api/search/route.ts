import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getSession } from '../../../lib/session'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const contains = (field: string) => ({ contains: q, mode: 'insensitive' as const })

  const [assets, people, locations, consumables, maintenance, allocations] = await Promise.all([
    prisma.asset.findMany({
      where: { OR: [{ name: contains('') }, { assetTag: contains('') }, { serialNumber: contains('') }, { modelNumber: contains('') }, { supplier: contains('') }] },
      select: { id: true, name: true, assetTag: true, status: true },
      take: 5,
    }),
    prisma.person.findMany({
      where: { OR: [{ name: contains('') }, { email: contains('') }, { department: contains('') }] },
      select: { id: true, name: true, department: true },
      take: 5,
    }),
    (prisma.location as any).findMany({
      where: { OR: [{ name: contains('') }, { address: contains('') }] },
      select: { id: true, name: true, address: true },
      take: 5,
    }),
    prisma.consumable.findMany({
      where: { OR: [{ name: contains('') }, { modelNumber: contains('') }] },
      select: { id: true, name: true, quantity: true, unit: true },
      take: 5,
    }),
    prisma.maintenance.findMany({
      where: { OR: [{ title: contains('') }, { description: contains('') }] },
      select: { id: true, title: true, status: true, asset: { select: { name: true } } },
      take: 5,
    }),
    prisma.allocation.findMany({
      where: { name: contains('') },
      select: { id: true, name: true, startDate: true },
      take: 5,
    }),
  ])

  return NextResponse.json({
    results: [
      { type: 'Assets', items: assets.map(a => ({ id: a.id, title: a.name, sub: a.assetTag, badge: a.status, href: `/assets/${a.id}` })) },
      { type: 'People', items: people.map(p => ({ id: p.id, title: p.name, sub: p.department ?? undefined, href: `/people/${p.id}` })) },
      { type: 'Locations', items: locations.map(l => ({ id: l.id, title: l.name, sub: l.address ?? undefined, href: `/locations/${l.id}` })) },
      { type: 'Consumables', items: consumables.map(c => ({ id: c.id, title: c.name, sub: `${c.quantity} ${c.unit}`, href: `/items/${c.id}` })) },
      { type: 'Maintenance', items: maintenance.map(m => ({ id: m.id, title: m.title, sub: (m as any).asset?.name, badge: m.status, href: `/maintenance` })) },
      { type: 'Allocations', items: allocations.map(a => ({ id: a.id, title: a.name, href: `/allocations/${a.id}` })) },
    ].filter(g => g.items.length > 0),
  })
}
