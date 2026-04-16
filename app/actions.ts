'use server'

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addAsset(prevState: any, formData: FormData) {
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
  await prisma.asset.update({
    where: { id },
    data: { notes: notes || null }
  })
  revalidatePath(`/assets/${id}`)
}

export async function updateConsumableNotes(id: number, notes: string) {
  await prisma.consumable.update({
    where: { id },
    data: { notes: notes || null }
  })
  revalidatePath(`/items/${id}`)
}

export async function adjustConsumableQuantity(id: number, delta: number) {
  const item = await prisma.consumable.findUnique({ where: { id } })
  if (!item) return

  await prisma.consumable.update({
    where: { id },
    data: { quantity: Math.max(0, item.quantity + delta) }
  })

  revalidatePath('/items')
}

export async function updateConsumable(prevState: any, formData: FormData) {
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

export async function deleteConsumables(prevState: any, formData: FormData) {
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
