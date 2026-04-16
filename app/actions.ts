'use server'

import { prisma } from '../lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addAsset(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const assetTag = formData.get('assetTag') as string
  const status = formData.get('status') as string
  const locationId = formData.get('locationId') as string

  try {
    await prisma.asset.create({
    data: { name, assetTag, status, locationId: locationId ? parseInt(locationId) : null }
    })
  } catch (e: any) {
    if (e.code === 'P2002') {
     return { error: `Asset tag "${assetTag}" is already in use` }
    }
    return { error: 'Something went wrong' }
  }

  revalidatePath('/assets')
  return null
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

  try {
    await prisma.asset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        assetTag,
        status,
        locationId: locationId ? parseInt(locationId) : null
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
