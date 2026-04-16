'use server'

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'
import { getSession, hasRole, requireAuth } from '../lib/session'
import type { Role } from '../lib/session'
import { redirect } from 'next/navigation'

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

  return { success: true }
}

export async function logout() {
  const session = await getSession()
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

  await fs.mkdir(uploadDir, { recursive: true })

  // Remove any previously uploaded logo regardless of extension
  for (const e of Object.values(ALLOWED_LOGO_TYPES)) {
    try { await fs.unlink(path.join(uploadDir, `logo.${e}`)) } catch {}
  }

  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  await prisma.setting.upsert({
    where: { key: 'logoPath' },
    update: { value: `/uploads/${filename}` },
    create: { key: 'logoPath', value: `/uploads/${filename}` },
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

  try {
    await prisma.asset.create({
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

  await prisma.asset.deleteMany({
    where: {
      id: { in: ids.map(id => parseInt(id)) }
    }
  })

  revalidatePath('/assets')
  return { success: true }
}


export async function addLocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const name = formData.get('name') as string
  const parentId = formData.get('parentId') as string

  await prisma.location.create({
    data: {
      name,
      parent: parentId ? { connect: { id: parseInt(parentId) } } : undefined
    }
  })

  revalidatePath('/locations')
  return null
}

export async function deleteLocations(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const ids = formData.getAll('selectedIds') as string[]

  if (ids.length === 0) {
    return { error: 'No locations selected' }
  }

  await prisma.location.deleteMany({
    where: {
      id: { in: ids.map(id => parseInt(id)) }
    }
  })

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

  revalidatePath('/items')
  return { success: true }
}

export async function updateAssetNotes(id: number, notes: string) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  await prisma.asset.update({
    where: { id },
    data: { notes: notes || null }
  })
  revalidatePath(`/assets/${id}`)
}

export async function updateConsumableNotes(id: number, notes: string) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  await prisma.consumable.update({
    where: { id },
    data: { notes: notes || null }
  })
  revalidatePath(`/items/${id}`)
}

export async function adjustConsumableQuantity(id: number, delta: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  const item = await prisma.consumable.findUnique({ where: { id } })
  if (!item) return

  await prisma.consumable.update({
    where: { id },
    data: { quantity: Math.max(0, item.quantity + delta) }
  })

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

  revalidatePath('/allocations')
  return { success: true }
}

export async function deleteAllocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return { error: 'Insufficient permissions' }

  const id = formData.get('id') as string
  await prisma.allocation.delete({ where: { id: parseInt(id) } })
  revalidatePath('/allocations')
  return { success: true }
}

export async function addAssetToAllocation(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return { error: 'Insufficient permissions' }

  const allocationId = parseInt(formData.get('allocationId') as string)
  const assetId = parseInt(formData.get('assetId') as string)

  if (!assetId) return { error: 'Select an asset' }

  await prisma.allocation.update({
    where: { id: allocationId },
    data: { assets: { connect: { id: assetId } } }
  })

  revalidatePath(`/allocations/${allocationId}`)
  return { success: true }
}

export async function removeAssetFromAllocation(allocationId: number, assetId: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'MANAGEMENT')) return

  await prisma.allocation.update({
    where: { id: allocationId },
    data: { assets: { disconnect: { id: assetId } } }
  })
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

  await prisma.asset.updateMany({
    where: { id: { in: ids.map(id => parseInt(id)) } },
    data: {
      ...(status ? { status } : {}),
      ...(locationId ? { locationId: parseInt(locationId) } : {})
    }
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

  await prisma.person.create({ data: { name, email, department } })
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

  await prisma.person.update({ where: { id }, data: { name, email, department } })
  revalidatePath('/people')
  revalidatePath(`/people/${id}`)
  return { success: true }
}

export async function deletePerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  await prisma.person.delete({ where: { id } })
  revalidatePath('/people')
  return { success: true }
}

export async function assignAssetToPerson(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const personId = parseInt(formData.get('personId') as string)
  const assetId = parseInt(formData.get('assetId') as string)

  if (!assetId) return { error: 'Select an asset' }

  await prisma.asset.update({ where: { id: assetId }, data: { assigneeId: personId } })
  revalidatePath(`/people/${personId}`)
  return { success: true }
}

export async function unassignAsset(assetId: number, personId: number) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return

  await prisma.asset.update({ where: { id: assetId }, data: { assigneeId: null } })
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

  revalidatePath('/maintenance')
  return { success: true }
}

export async function deleteMaintenance(prevState: any, formData: FormData) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return { error: 'Insufficient permissions' }

  const id = parseInt(formData.get('id') as string)
  await prisma.maintenance.delete({ where: { id } })
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
