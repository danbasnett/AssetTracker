import { prisma } from './prisma'

export async function spawnDueRepeats() {
  const now = new Date()
  const twoMonthsFromNow = new Date(now)
  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2)

  const candidates = await (prisma.maintenance as any).findMany({
    where: {
      repeatIntervalDays: { not: null },
      scheduledDate: { not: null },
      children: {
        none: {
          scheduledDate: { gt: now },
        },
      },
    },
  })

  let spawned = 0
  for (const m of candidates) {
    if (m.scheduledDate === null || m.repeatIntervalDays === null) continue

    const endDate = m.repeatEndDate ? new Date(m.repeatEndDate) : null
    const ceiling = endDate && endDate < twoMonthsFromNow ? endDate : twoMonthsFromNow

    let prevId = m.id
    let nextDate = new Date(m.scheduledDate)
    nextDate.setDate(nextDate.getDate() + m.repeatIntervalDays)

    while (nextDate <= ceiling) {
      const created = await (prisma.maintenance as any).create({
        data: {
          assetId: m.assetId,
          title: m.title,
          description: m.description,
          status: 'SCHEDULED',
          scheduledDate: new Date(nextDate),
          repeatIntervalDays: m.repeatIntervalDays,
          repeatEndDate: m.repeatEndDate ?? null,
          parentId: prevId,
        },
      })
      prevId = created.id
      spawned++
      nextDate.setDate(nextDate.getDate() + m.repeatIntervalDays)
    }
  }
  return spawned
}
