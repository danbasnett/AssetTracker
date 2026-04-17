'use server'

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'
import { getSession, hasRole, requireAuth } from '../lib/session'
import type { Role } from '../lib/session'
import { redirect } from 'next/navigation'
import { audit, diff } from '../lib/audit'

// Dummy hash used to prevent timing-based username enumeration.
// bcrypt.compare always runs even when the username doesn't exist.
const DUMMY_HASH = '$2b$12$LCezj5CS.oC0EBPbQPW2HOcJjJ8PdPKsRMVMnxBCexRiUYKBb7dGS'

const PASSWORD_MIN = 12

export async function login(prevState: any, formData: FormData) {
  const username = (formData.get('username') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const genericError = { error: 'Invalid username or password' }

  if (!username || !password) return genericError

  const user = await prisma.user.findUnique({ where: { username } })

  // Always run bcrypt.compare to prevent timing-based username enumeration
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !valid) return genericError

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const session = await getSession()
  session.userId = user.id
  session.username = user.username
  session.role = user.role as Role
  session.isLoggedIn = true
  await session.save()
  await audit(user.id, user.username, 'LOGIN', 'User', user.id, user.username)
  return { success: true }
}

export async function logout() {
  const session = await getSession()
  await audit(session.userId, session.username, 'LOGOUT', 'User', session.userId, session.username)
  session.destroy()
  redirect('/login')
}

export async function createFirstUser(prevState: any, formData: FormData) {
  const existing = await prisma.user.count()
  if (existing > 0) return { error: 'Setup already complete' }

  const username = (formData.get('username') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' }
  if (password.length < PASSWORD_MIN) return { error: `Password must be at least ${PASSWORD_MIN} characters` }
  if (password !== confirm) return { error: 'Passwords do not match' }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { username, passwordHash, role: 'ADMIN' } })

  const session = await getSession()
  session.userId = user.id
  session.username = user.username
  session.role = 'ADMIN'
  session.isLoggedIn = true
  await session.save()

  return { success: true }
}

const VALID_ROLES: Role[] = ['VIEW_ONLY', 'ASSET_CONTROL', 'MANAGEMENT', 'ADMIN']

export async function createUser(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const username = (formData.get('username') as string).trim().toLowerCase()
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string
  const role = (formData.get('role') as Role) || 'VIEW_ONLY'

  if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' }
  if (password.length < PASSWORD_MIN) return { error: `Password must be at least ${PASSWORD_MIN} characters` }
  if (password !== confirm) return { error: 'Passwords do not match' }
  if (!VALID_ROLES.includes(role)) return { error: 'Invalid role' }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({ data: { username, passwordHash, role } })
  } catch (e: any) {
    if (e.code === 'P2002') return { error: `Username "${username}" is already taken` }
    return { error: 'Something went wrong' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function changeUserRole(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const role = formData.get('role') as Role

  if (!VALID_ROLES.includes(role)) return { error: 'Invalid role' }
  if (session.userId === id) return { error: 'You cannot change your own role' }

  await prisma.user.update({ where: { id }, data: { role } })
  revalidatePath('/settings')
  return { success: true }
}

export async function deleteUser(prevState: any, formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const session = await getSession()

  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }
  if (session.userId === id) return { error: 'You cannot delete your own account' }

  const remaining = await prisma.user.count()
  if (remaining <= 1) return { error: 'Cannot delete the last user account' }

  await prisma.user.delete({ where: { id } })
  revalidatePath('/settings')
  return { success: true }
}

export async function changePassword(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const newPassword = formData.get('newPassword') as string
  const confirm = formData.get('confirm') as string

  if (newPassword.length < PASSWORD_MIN) return { error: `Password must be at least ${PASSWORD_MIN} characters` }
  if (newPassword !== confirm) return { error: 'Passwords do not match' }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id }, data: { passwordHash } })

  revalidatePath('/settings')
  return { success: true }
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function uploadAvatar(prevState: any, formData: FormData) {
  const session = await requireAuth()
  const file = formData.get('avatar') as File

  if (!file || file.size === 0) return { error: 'No file selected' }
  if (!(file.type in ALLOWED_IMAGE_TYPES)) return { error: 'Only PNG, JPEG, WebP, or GIF files are allowed' }
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2 MB' }

  const ext = ALLOWED_IMAGE_TYPES[file.type]
  const filename = `avatar-${session.userId}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

  await fs.mkdir(uploadDir, { recursive: true })

  // Remove any previous avatar for this user
  for (const e of Object.values(ALLOWED_IMAGE_TYPES)) {
    try { await fs.unlink(path.join(uploadDir, `avatar-${session.userId}.${e}`)) } catch {}
  }

  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarPath: `/uploads/avatars/${filename}` },
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function uploadLogo(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const file = formData.get('logo') as File

  if (!file || file.size === 0) return { error: 'No file selected' }
  if (!(file.type in ALLOWED_LOGO_TYPES)) return { error: 'Only PNG, JPEG, WebP, and SVG files are allowed' }
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2 MB' }

  const ext = ALLOWED_LOGO_TYPES[file.type]
  const filename = `logo.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  try {
    await fs.mkdir(uploadDir, { recursive: true })

    for (const e of Object.values(ALLOWED_LOGO_TYPES)) {
      try { await fs.unlink(path.join(uploadDir, `logo.${e}`)) } catch {}
    }

    await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  } catch (e: any) {
    return { error: `Failed to save file: ${e.message}` }
  }

  await prisma.setting.upsert({
    where: { key: 'logoPath' },
    update: { value: `/uploads/${filename}?t=${Date.now()}` },
    create: { key: 'logoPath', value: `/uploads/${filename}?t=${Date.now()}` },
  })

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function removeLogo() {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return

  const setting = await prisma.setting.findUnique({ where: { key: 'logoPath' } })
  if (setting) {
    try { await fs.unlink(path.join(process.cwd(), 'public', setting.value)) } catch {}
    await prisma.setting.delete({ where: { key: 'logoPath' } })
  }
  revalidatePath('/', 'layout')
}

export async function addAsset(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  const assetTag = formData.get('assetTag') as string
  const status = formData.get('status') as string
  const locationId = formData.get('locationId') as string
  const serialNumber = formData.get('serialNumber') as string
  const modelNumber = formData.get('modelNumber') as string
  const supplier = formData.get('supplier') as string
  const purchaseDate = formData.get('purchaseDate') as string
  const value = formData.get('value') as string

  let created: any
  try {
    created = await prisma.asset.create({
    data: {
      name, assetTag, status,
      locationId: locationId ? parseInt(locationId) : null,
      serialNumber: serialNumber || null,
      modelNumber: modelNumber || null,
      supplier: supplier || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      value: value ? parseFloat(value) : null
    }
    })
  } catch (e: any) {
    if (e.code === 'P2002') {
     return { error: `Asset tag "${assetTag}" is already in use` }
    }
    return { error: 'Something went wrong' }
  }

  await audit(session.userId, session.username, 'CREATE', 'Asset', created.id, name, { assetTag, status, serialNumber: serialNumber||null, modelNumber: modelNumber||null, supplier: supplier||null, purchaseDate: purchaseDate||null, value: value||null, locationId: locationId||null })
  revalidatePath('/assets')
  return { success: true }
}

export async function deleteAssets(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = formData.getAll('selectedIds') as string[]
  
  if (ids.length === 0) {
    return { error: 'No assets selected' }
  }

  const toDelete = await prisma.asset.findMany({ where: { id: { in: ids.map(id => parseInt(id)) } }, select: { id: true, name: true, assetTag: true } })
  await prisma.asset.deleteMany({ where: { id: { in: ids.map(id => parseInt(id)) } } })
  await audit(session.userId, session.username, 'DELETE', 'Asset', undefined, undefined, { deleted: toDelete })
  revalidatePath('/assets')
  return { success: true }
}


export async function addLocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  const parentId = formData.get('parentId') as string

  const newLoc = await prisma.location.create({
    data: {
      name,
      parent: parentId ? { connect: { id: parseInt(parentId) } } : undefined
    }
  })

  await audit(session.userId, session.username, 'CREATE', 'Location', newLoc.id, name, { name, parentId: parentId ? parseInt(parentId) : null })
  revalidatePath('/locations')
  return null
}

export async function updateLocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const name = (formData.get('name') as string).trim()
  const parentId = formData.get('parentId') as string

  if (!name) return { error: 'Name is required' }

  if (parentId) {
    const newParentId = parseInt(parentId)
    if (newParentId === id) return { error: 'A location cannot be its own parent' }

    // Walk up the ancestor chain of the chosen parent — if we hit `id`, it's circular
    const all = await prisma.location.findMany({ select: { id: true, parentId: true } })
    const parentMap = Object.fromEntries(all.map(l => [l.id, l.parentId]))
    let cursor: number | null = newParentId
    while (cursor !== null) {
      cursor = parentMap[cursor] ?? null
      if (cursor === id) return { error: 'This would create a circular reference' }
    }
  }

  const beforeLoc = await prisma.location.findUnique({ where: { id } })
  await prisma.location.update({
    where: { id },
    data: { name, parentId: parentId ? parseInt(parentId) : null },
  })

  const changesLoc = beforeLoc ? diff(
    { name: beforeLoc.name, parentId: beforeLoc.parentId },
    { name, parentId: parentId ? parseInt(parentId) : null }
  ) : {}
  await audit(session.userId, session.username, 'UPDATE', 'Location', id, name, { changes: changesLoc })
  revalidatePath('/locations')
  revalidatePath(`/locations/${id}`)
  return { success: true }
}

export async function updateLocationDetails(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const address = (formData.get('address') as string).trim() || null
  const notes = (formData.get('notes') as string).trim() || null

  const beforeLD = await (prisma.location as any).findUnique({ where: { id } })
  await (prisma.location as any).update({
    where: { id },
    data: { address, notes },
  })

  const changesLD = beforeLD ? diff({ address: beforeLD.address, notes: beforeLD.notes }, { address, notes }) : {}
  await audit(session.userId, session.username, 'UPDATE', 'Location', id, beforeLD?.name, { changes: changesLD })
  revalidatePath(`/locations/${id}`)
  return { success: true }
}

export async function deleteLocations(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = formData.getAll('selectedIds') as string[]

  if (ids.length === 0) {
    return { error: 'No locations selected' }
  }

  const toDeleteLocs = await prisma.location.findMany({ where: { id: { in: ids.map(id => parseInt(id)) } }, select: { id: true, name: true } })
  await prisma.location.deleteMany({
    where: {
      id: { in: ids.map(id => parseInt(id)) }
    }
  })

  await audit(session.userId, session.username, 'DELETE', 'Location', undefined, undefined, { deleted: toDeleteLocs })
  revalidatePath('/locations')
  return { success: true }
}

export async function updateAsset(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const assetTag = formData.get('assetTag') as string
  const status = formData.get('status') as string
  const locationId = formData.get('locationId') as string
  const serialNumber = formData.get('serialNumber') as string
  const modelNumber = formData.get('modelNumber') as string
  const supplier = formData.get('supplier') as string
  const purchaseDate = formData.get('purchaseDate') as string
  const value = formData.get('value') as string

  const before = await prisma.asset.findUnique({ where: { id: parseInt(id) } })

  try {
    await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        assetTag,
        status,
        locationId: locationId ? parseInt(locationId) : null,
        serialNumber: serialNumber || null,
        modelNumber: modelNumber || null,
        supplier: supplier || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        value: value ? parseFloat(value) : null
      }
    })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return { error: `Asset tag "${assetTag}" is already in use` }
    }
    return { error: 'Something went wrong' }
  }

  const changes = before ? diff(
    { name: before.name, assetTag: before.assetTag, status: before.status, serialNumber: before.serialNumber, modelNumber: before.modelNumber, supplier: before.supplier, value: before.value, locationId: before.locationId },
    { name, assetTag, status, serialNumber: serialNumber||null, modelNumber: modelNumber||null, supplier: supplier||null, value: value ? parseFloat(value) : null, locationId: locationId ? parseInt(locationId) : null }
  ) : {}
  await audit(session.userId, session.username, 'UPDATE', 'Asset', parseInt(id), name, { changes })
  revalidatePath('/assets')
  return { success: true }
}

export async function addConsumable(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  const quantity = formData.get('quantity') as string
  const reorderPoint = formData.get('reorderPoint') as string
  const unit = formData.get('unit') as string
  const locationId = formData.get('locationId') as string
  const modelNumber = formData.get('modelNumber') as string

  await prisma.consumable.create({
    data: {
      name,
      quantity: parseInt(quantity) || 0,
      reorderPoint: parseInt(reorderPoint) || 5,
      unit: unit || 'each',
      locationId: locationId ? parseInt(locationId) : null,
      modelNumber: modelNumber || null
    }
  })

  await audit(session.userId, session.username, 'CREATE', 'Consumable', undefined, name, { name, quantity: parseInt(quantity)||0, unit: unit||'each', reorderPoint: parseInt(reorderPoint)||5, modelNumber: modelNumber||null, locationId: locationId||null })
  revalidatePath('/items')
  return { success: true }
}

export async function updateAssetNotes(id: number, notes: string) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  const beforeAN = await prisma.asset.findUnique({ where: { id }, select: { name: true, notes: true } })
  await prisma.asset.update({ where: { id }, data: { notes: notes || null } })
  await audit(session.userId, session.username, 'UPDATE', 'Asset', id, beforeAN?.name, { changes: { notes: { from: beforeAN?.notes ?? null, to: notes || null } } })
  revalidatePath(`/assets/${id}`)
}

export async function updateConsumableNotes(id: number, notes: string) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  const beforeCN = await prisma.consumable.findUnique({ where: { id }, select: { name: true, notes: true } })
  await prisma.consumable.update({ where: { id }, data: { notes: notes || null } })
  await audit(session.userId, session.username, 'UPDATE', 'Consumable', id, beforeCN?.name, { changes: { notes: { from: (beforeCN as any)?.notes ?? null, to: notes || null } } })
  revalidatePath(`/items/${id}`)
}

export async function adjustConsumableQuantity(id: number, delta: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  const item = await prisma.consumable.findUnique({ where: { id } })
  if (!item) return

  const newQty = Math.max(0, item.quantity + delta)
  await prisma.consumable.update({
    where: { id },
    data: { quantity: newQty }
  })

  await audit(session.userId, session.username, 'UPDATE', 'Consumable', id, item.name, { changes: { quantity: { from: item.quantity, to: newQty } } })
  revalidatePath('/items')
}

export async function updateConsumable(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const quantity = formData.get('quantity') as string
  const reorderPoint = formData.get('reorderPoint') as string
  const unit = formData.get('unit') as string
  const locationId = formData.get('locationId') as string
  const modelNumber = formData.get('modelNumber') as string

  const beforeC = await prisma.consumable.findUnique({ where: { id: parseInt(id) } })
  await prisma.consumable.update({
    where: { id: parseInt(id) },
    data: {
      name,
      quantity: parseInt(quantity) || 0,
      reorderPoint: parseInt(reorderPoint) || 0,
      unit,
      locationId: locationId ? parseInt(locationId) : null,
      modelNumber: modelNumber || null
    }
  })

  const changesC = beforeC ? diff(
    { name: beforeC.name, quantity: beforeC.quantity, unit: beforeC.unit, reorderPoint: beforeC.reorderPoint, modelNumber: beforeC.modelNumber, locationId: beforeC.locationId },
    { name, quantity: parseInt(quantity)||0, unit, reorderPoint: parseInt(reorderPoint)||0, modelNumber: modelNumber||null, locationId: locationId ? parseInt(locationId) : null }
  ) : {}
  await audit(session.userId, session.username, 'UPDATE', 'Consumable', parseInt(id), name, { changes: changesC })
  revalidatePath('/items')
  return { success: true }
}

export async function createAllocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return { error: 'Insufficient permissions' }

  const name = (formData.get('name') as string).trim()
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const indefinite = formData.get('indefinite') === 'true'

  if (!name) return { error: 'Name is required' }
  if (!startDate) return { error: 'Start date is required' }

  await prisma.allocation.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: indefinite || !endDate ? null : new Date(endDate),
      indefinite
    }
  })

  await audit(session.userId, session.username, 'CREATE', 'Allocation', undefined, name, { name, startDate: startDate||null, endDate: (indefinite||!endDate) ? null : endDate, indefinite })
  revalidatePath('/allocations')
  return { success: true }
}

export async function deleteAllocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return { error: 'Insufficient permissions' }

  const id = formData.get('id') as string
  const allocDel = await prisma.allocation.findUnique({ where: { id: parseInt(id) } })
  await prisma.allocation.delete({ where: { id: parseInt(id) } })
  await audit(session.userId, session.username, 'DELETE', 'Allocation', parseInt(id), allocDel?.name, { name: allocDel?.name, startDate: allocDel?.startDate, endDate: allocDel?.endDate, indefinite: allocDel?.indefinite })
  revalidatePath('/allocations')
  return { success: true }
}

export async function addAssetToAllocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return { error: 'Insufficient permissions' }

  const allocationId = parseInt(formData.get('allocationId') as string)
  const assetId = parseInt(formData.get('assetId') as string)

  if (!assetId) return { error: 'Select an asset' }

  const [assignAsset, assignAlloc] = await Promise.all([
    prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } }),
    prisma.allocation.findUnique({ where: { id: allocationId }, select: { name: true } }),
  ])
  await prisma.allocation.update({
    where: { id: allocationId },
    data: { assets: { connect: { id: assetId } } }
  })

  await audit(session.userId, session.username, 'ASSIGN', 'Allocation', allocationId, assignAlloc?.name, { allocation: assignAlloc?.name, asset: assignAsset?.name, assetTag: assignAsset?.assetTag })
  revalidatePath(`/allocations/${allocationId}`)
  return { success: true }
}

export async function removeAssetFromAllocation(allocationId: number, assetId: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return

  const [removeAsset, removeAlloc] = await Promise.all([
    prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } }),
    prisma.allocation.findUnique({ where: { id: allocationId }, select: { name: true } }),
  ])
  await prisma.allocation.update({
    where: { id: allocationId },
    data: { assets: { disconnect: { id: assetId } } }
  })
  await audit(session.userId, session.username, 'UNASSIGN', 'Allocation', allocationId, removeAlloc?.name, { allocation: removeAlloc?.name, asset: removeAsset?.name, assetTag: removeAsset?.assetTag })
  revalidatePath(`/allocations/${allocationId}`)
}

export async function addStatus(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const name = (formData.get('name') as string).trim()

  if (!name) {
    return { error: 'Status name is required' }
  }

  try {
    await prisma.status.create({ data: { name } })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return { error: `Status "${name}" already exists` }
    }
    return { error: 'Something went wrong' }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteStatus(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const id = formData.get('id') as string

  await prisma.status.delete({ where: { id: parseInt(id) } })

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteConsumables(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = formData.getAll('selectedIds') as string[]

  if (ids.length === 0) {
    return { error: 'No items selected' }
  }

  await prisma.consumable.deleteMany({
    where: {
      id: { in: ids.map(id => parseInt(id)) }
    }
  })

  revalidatePath('/items')
  return { success: true }
}

export async function bulkUpdateAssets(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = formData.getAll('selectedIds') as string[]
  const status = formData.get('status') as string
  const locationId = formData.get('locationId') as string

  if (ids.length === 0) {
    return { error: 'No assets selected' }
  }

  const affectedAssets = await prisma.asset.findMany({ where: { id: { in: ids.map(id => parseInt(id)) } }, select: { id: true, name: true, assetTag: true } })
  await prisma.asset.updateMany({
    where: { id: { in: ids.map(id => parseInt(id)) } },
    data: {
      ...(status ? { status } : {}),
      ...(locationId ? { locationId: parseInt(locationId) } : {})
    }
  })

  await audit(session.userId, session.username, 'UPDATE', 'Asset', undefined, undefined, {
    assets: affectedAssets.map(a => ({ id: a.id, name: a.name, assetTag: a.assetTag })),
    ...(status ? { status } : {}),
    ...(locationId ? { locationId: parseInt(locationId) } : {}),
  })
  revalidatePath('/assets')
  return { success: true }
}

// ── People ────────────────────────────────────────────────────────────────────

export async function createPerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const name = (formData.get('name') as string).trim()
  const email = (formData.get('email') as string).trim() || null
  const department = (formData.get('department') as string).trim() || null

  if (!name) return { error: 'Name is required' }

  const person = await prisma.person.create({ data: { name, email, department } })
  await audit(session.userId, session.username, 'CREATE', 'Person', person.id, name, { name, email, department })
  revalidatePath('/people')
  return { success: true }
}

export async function updatePerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const name = (formData.get('name') as string).trim()
  const email = (formData.get('email') as string).trim() || null
  const department = (formData.get('department') as string).trim() || null

  if (!name) return { error: 'Name is required' }

  const beforeP = await prisma.person.findUnique({ where: { id } })
  await prisma.person.update({ where: { id }, data: { name, email, department } })
  const changesP = beforeP ? diff({ name: beforeP.name, email: beforeP.email, department: beforeP.department }, { name, email, department }) : {}
  await audit(session.userId, session.username, 'UPDATE', 'Person', id, name, { changes: changesP })
  revalidatePath('/people')
  revalidatePath(`/people/${id}`)
  return { success: true }
}

export async function deletePerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const personDel = await prisma.person.findUnique({ where: { id } })
  await prisma.person.delete({ where: { id } })
  await audit(session.userId, session.username, 'DELETE', 'Person', id, personDel?.name, { name: personDel?.name, email: personDel?.email, department: personDel?.department })
  revalidatePath('/people')
  return { success: true }
}

export async function assignAssetToPerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const personId = parseInt(formData.get('personId') as string)
  const assetId = parseInt(formData.get('assetId') as string)

  if (!assetId) return { error: 'Select an asset' }

  const [assignPerson, assignA] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId }, select: { name: true } }),
    prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } }),
  ])
  await prisma.asset.update({ where: { id: assetId }, data: { assigneeId: personId } })
  await audit(session.userId, session.username, 'ASSIGN', 'Person', personId, assignPerson?.name, { person: assignPerson?.name, asset: assignA?.name, assetTag: assignA?.assetTag })
  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unassignAsset(assetId: number, personId: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  const [unassignPerson, unassignA] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId }, select: { name: true } }),
    prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } }),
  ])
  await prisma.asset.update({ where: { id: assetId }, data: { assigneeId: null } })
  await audit(session.userId, session.username, 'UNASSIGN', 'Person', personId, unassignPerson?.name, { person: unassignPerson?.name, asset: unassignA?.name, assetTag: unassignA?.assetTag })
  revalidatePath(`/people/${personId}`)
}

// ── Maintenance ───────────────────────────────────────────────────────────────

export async function createMaintenance(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const assetId = parseInt(formData.get('assetId') as string)
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const status = (formData.get('status') as string) || 'SCHEDULED'
  const scheduledDate = formData.get('scheduledDate') as string
  const completedDate = formData.get('completedDate') as string
  const cost = formData.get('cost') as string
  const repeatIntervalDays = formData.get('repeatIntervalDays') as string
  const repeatEndDate = formData.get('repeatEndDate') as string

  if (!assetId) return { error: 'Asset is required' }
  if (!title) return { error: 'Title is required' }

  await (prisma.maintenance as any).create({
    data: {
      assetId,
      title,
      description,
      status: (completedDate ? 'COMPLETED' : status),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      completedDate: completedDate ? new Date(completedDate) : null,
      cost: cost ? parseFloat(cost) : null,
      repeatIntervalDays: repeatIntervalDays ? parseInt(repeatIntervalDays) : null,
      repeatEndDate: repeatEndDate ? new Date(repeatEndDate) : null,
    }
  })

  const mAsset = await prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } })
  await audit(session.userId, session.username, 'CREATE', 'Maintenance', undefined, title, { asset: mAsset?.name, assetTag: mAsset?.assetTag, title, description, status: completedDate ? 'COMPLETED' : status, scheduledDate: scheduledDate||null, cost: cost||null })
  revalidatePath('/maintenance')
  return { success: true }
}

export async function updateMaintenance(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim() || null
  const status = formData.get('status') as string
  const scheduledDate = formData.get('scheduledDate') as string
  const completedDate = formData.get('completedDate') as string
  const cost = formData.get('cost') as string
  const repeatIntervalDays = formData.get('repeatIntervalDays') as string
  const repeatEndDate = formData.get('repeatEndDate') as string

  if (!title) return { error: 'Title is required' }

  const beforeM = await (prisma.maintenance as any).findUnique({ where: { id } })

  await (prisma.maintenance as any).update({
    where: { id },
    data: {
      title,
      description,
      status: (completedDate ? 'COMPLETED' : status),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      completedDate: completedDate ? new Date(completedDate) : null,
      cost: cost ? parseFloat(cost) : null,
      repeatIntervalDays: repeatIntervalDays ? parseInt(repeatIntervalDays) : null,
      repeatEndDate: repeatEndDate ? new Date(repeatEndDate) : null,
    }
  })

  const mAssetUpd = beforeM ? await prisma.asset.findUnique({ where: { id: beforeM.assetId }, select: { name: true, assetTag: true } }) : null
  await audit(session.userId, session.username, 'UPDATE', 'Maintenance', id, title, {
    asset: mAssetUpd?.name, assetTag: mAssetUpd?.assetTag,
    changes: beforeM ? diff(
      { title: beforeM.title, status: beforeM.status, scheduledDate: String(beforeM.scheduledDate), completedDate: String(beforeM.completedDate), cost: beforeM.cost, description: beforeM.description },
      { title, status: completedDate ? 'COMPLETED' : status, scheduledDate, completedDate, cost: cost||null, description }
    ) : {}
  })
  revalidatePath('/maintenance')
  return { success: true }
}

export async function deleteMaintenance(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  const mDel = await (prisma.maintenance as any).findUnique({ where: { id }, include: { asset: { select: { name: true, assetTag: true } } } })
  await prisma.maintenance.delete({ where: { id } })
  await audit(session.userId, session.username, 'DELETE', 'Maintenance', id, mDel?.title, { title: mDel?.title, asset: mDel?.asset?.name, assetTag: mDel?.asset?.assetTag, status: mDel?.status, scheduledDate: mDel?.scheduledDate })
  revalidatePath('/maintenance')
  return { success: true }
}

export async function deleteMaintenanceSeries(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = (formData.get('ids') as string).split(',').map(Number).filter(Boolean)
  // keepIds: records being kept (completed history) — stop them from spawning more
  const keepIds = (formData.get('keepIds') as string | null)?.split(',').map(Number).filter(Boolean) ?? []

  await prisma.maintenance.deleteMany({ where: { id: { in: ids } } })

  if (keepIds.length > 0) {
    // Only clear repeatIntervalDays on the leaf kept record (no other kept record points to it as parent)
    // This stops future spawning without removing the series grouping on the root
    const parentIds = new Set(
      (await (prisma.maintenance as any).findMany({
        where: { id: { in: keepIds }, parentId: { not: null } },
        select: { parentId: true },
      })).map((r: any) => r.parentId)
    )
    const leafIds = keepIds.filter(id => !parentIds.has(id))
    if (leafIds.length > 0) {
      await (prisma.maintenance as any).updateMany({
        where: { id: { in: leafIds } },
        data: { repeatIntervalDays: null, repeatEndDate: null },
      })
    }
  }

  revalidatePath('/maintenance')
  return { success: true }
}

export async function reportProblem(prevState: any, formData: FormData) {
  await requireAuth()

  const assetId = parseInt(formData.get('assetId') as string)
  const description = (formData.get('description') as string).trim() || null

  await prisma.maintenance.create({
    data: {
      assetId,
      title: 'Problem reported',
      description,
      status: 'PENDING' as any,
    },
  })

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/maintenance')
  return { success: true }
}

export async function deleteAllData() {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  await audit(session.userId, session.username, 'DELETE_ALL', 'System', undefined, undefined, 'All data deleted')
  await prisma.maintenance.deleteMany()
  await prisma.allocation.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.consumable.deleteMany()
  await prisma.person.deleteMany()
  await prisma.location.deleteMany()

  revalidatePath('/', 'layout')
  return { success: true }
}

// ── SSO / OAuth Providers ─────────────────────────────────────────────────────

export async function upsertOAuthProvider(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  const label = formData.get('label') as string
  const clientId = (formData.get('clientId') as string).trim()
  const clientSecret = (formData.get('clientSecret') as string).trim()
  const defaultRole = (formData.get('defaultRole') as string) || 'VIEW_ONLY'
  const enabled = formData.get('enabled') === 'true'
  const appleTeamId = (formData.get('appleTeamId') as string)?.trim() || null
  const appleKeyId = (formData.get('appleKeyId') as string)?.trim() || null
  const applePrivKey = (formData.get('applePrivKey') as string)?.trim() || null
  const authUrl = (formData.get('authUrl') as string)?.trim() || null
  const tokenUrl = (formData.get('tokenUrl') as string)?.trim() || null
  const userinfoUrl = (formData.get('userinfoUrl') as string)?.trim() || null
  const scope = (formData.get('scope') as string)?.trim() || null

  if (!clientId || !clientSecret) return { error: 'Client ID and Client Secret are required' }

  await (prisma as any).oAuthProvider.upsert({
    where: { name },
    update: { label, clientId, clientSecret, defaultRole, enabled, appleTeamId, appleKeyId, applePrivKey, authUrl, tokenUrl, userinfoUrl, scope },
    create: { name, label, clientId, clientSecret, defaultRole, enabled, appleTeamId, appleKeyId, applePrivKey, authUrl, tokenUrl, userinfoUrl, scope },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function deleteOAuthProvider(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ADMIN')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  await (prisma as any).oAuthProvider.delete({ where: { name } })
  revalidatePath('/settings')
  return { success: true }
}

// ── CSV Import ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values: string[] = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuote = !inQuote }
      else if (line[i] === ',' && !inQuote) { values.push(cur.trim()); cur = '' }
      else cur += line[i]
    }
    values.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function parseDate(val: string): Date | null {
  if (!val) return null
  const [d, m, y] = val.split('/')
  if (!d || !m || !y) return null
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return isNaN(date.getTime()) ? null : date
}

export async function importAssets(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return { error: 'No data rows found' }

  const locationNames = [...new Set(rows.map(r => r.location).filter(Boolean))]
  const locations = await prisma.location.findMany({ where: { name: { in: locationNames } } })
  const locationMap = Object.fromEntries(locations.map(l => [l.name.toLowerCase(), l.id]))

  let imported = 0, skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2
    if (!row.name || !row.assettag) { errors.push(`Row ${rowNum}: name and assetTag are required`); skipped++; continue }
    try {
      await prisma.asset.upsert({
        where: { assetTag: row.assettag },
        update: {
          name: row.name,
          status: row.status || 'Available',
          locationId: row.location ? (locationMap[row.location.toLowerCase()] ?? null) : null,
          serialNumber: row.serialnumber || null,
          modelNumber: row.modelnumber || null,
          supplier: row.supplier || null,
          purchaseDate: parseDate(row.purchasedate),
          value: row.value ? parseFloat(row.value) : null,
        },
        create: {
          name: row.name,
          assetTag: row.assettag,
          status: row.status || 'Available',
          locationId: row.location ? (locationMap[row.location.toLowerCase()] ?? null) : null,
          serialNumber: row.serialnumber || null,
          modelNumber: row.modelnumber || null,
          supplier: row.supplier || null,
          purchaseDate: parseDate(row.purchasedate),
          value: row.value ? parseFloat(row.value) : null,
        },
      })
      imported++
    } catch (e: any) {
      errors.push(`Row ${rowNum} (${row.name}): ${e.message}`)
      skipped++
    }
  }

  await audit(session.userId, session.username, 'IMPORT', 'Asset', undefined, undefined, `Imported ${imported}, skipped ${skipped}`)
  revalidatePath('/assets')
  return { success: true, imported, skipped, errors }
}

export async function importConsumables(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return { error: 'No data rows found' }

  const locationNames = [...new Set(rows.map(r => r.location).filter(Boolean))]
  const locations = await prisma.location.findMany({ where: { name: { in: locationNames } } })
  const locationMap = Object.fromEntries(locations.map(l => [l.name.toLowerCase(), l.id]))

  let imported = 0, skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2
    if (!row.name) { errors.push(`Row ${rowNum}: name is required`); skipped++; continue }
    try {
      await prisma.consumable.create({
        data: {
          name: row.name,
          quantity: row.quantity ? parseInt(row.quantity) : 0,
          reorderPoint: row.reorderpoint ? parseInt(row.reorderpoint) : 5,
          unit: row.unit || 'each',
          modelNumber: row.modelnumber || null,
          locationId: row.location ? (locationMap[row.location.toLowerCase()] ?? null) : null,
          notes: row.notes || null,
        },
      })
      imported++
    } catch (e: any) {
      errors.push(`Row ${rowNum} (${row.name}): ${e.message}`)
      skipped++
    }
  }

  await audit(session.userId, session.username, 'IMPORT', 'Consumable', undefined, undefined, `Imported ${imported}, skipped ${skipped}`)
  revalidatePath('/items')
  return { success: true, imported, skipped, errors }
}

export async function importLocations(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return { error: 'No data rows found' }

  let imported = 0, skipped = 0
  const errors: string[] = []
  const created: Record<string, number> = {}

  // Pre-load existing locations
  const existing = await prisma.location.findMany()
  for (const l of existing) created[l.name.toLowerCase()] = l.id

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2
    if (!row.name) { errors.push(`Row ${rowNum}: name is required`); skipped++; continue }
    if (created[row.name.toLowerCase()]) { skipped++; continue }
    try {
      const parentId = row.parent ? (created[row.parent.toLowerCase()] ?? null) : null
      const loc = await prisma.location.create({ data: { name: row.name, parentId } })
      created[row.name.toLowerCase()] = loc.id
      imported++
    } catch (e: any) {
      errors.push(`Row ${rowNum} (${row.name}): ${e.message}`)
      skipped++
    }
  }

  await audit(session.userId, session.username, 'IMPORT', 'Location', undefined, undefined, `Imported ${imported}, skipped ${skipped}`)
  revalidatePath('/locations')
  return { success: true, imported, skipped, errors }
}

export async function importPeople(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'No file selected' }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return { error: 'No data rows found' }

  let imported = 0, skipped = 0
  const errors: string[] = []

  for (const [i, row] of rows.entries()) {
    const rowNum = i + 2
    if (!row.name) { errors.push(`Row ${rowNum}: name is required`); skipped++; continue }
    try {
      await prisma.person.create({
        data: {
          name: row.name,
          email: row.email || null,
          department: row.department || null,
        },
      })
      imported++
    } catch (e: any) {
      errors.push(`Row ${rowNum} (${row.name}): ${e.message}`)
      skipped++
    }
  }

  await audit(session.userId, session.username, 'IMPORT', 'Person', undefined, undefined, `Imported ${imported}, skipped ${skipped}`)
  revalidatePath('/people')
  return { success: true, imported, skipped, errors }
}
