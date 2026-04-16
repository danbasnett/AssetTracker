import { prisma } from './prisma'

export async function audit(
  userId: number,
  username: string,
  action: string,
  entity: string,
  entityId?: number | null,
  entityName?: string | null,
  detail?: string | Record<string, any> | null,
) {
  try {
    const detailStr = detail == null
      ? null
      : typeof detail === 'string'
        ? detail
        : JSON.stringify(detail, null, 0)

    await (prisma.auditLog as any).create({
      data: { userId, username, action, entity, entityId: entityId ?? null, entityName: entityName ?? null, detail: detailStr },
    })
  } catch {
    // Never let audit logging break the main operation
  }
}

export function diff(before: Record<string, any>, after: Record<string, any>): Record<string, { from: any; to: any }> {
  const changes: Record<string, { from: any; to: any }> = {}
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) {
    const a = before[key] ?? null
    const b = after[key] ?? null
    if (String(a) !== String(b)) changes[key] = { from: a, to: b }
  }
  return changes
}
