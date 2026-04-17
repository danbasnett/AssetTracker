import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasRole } from '../../../../../lib/session'
import { prisma } from '../../../../../lib/prisma'
import fs from 'fs/promises'
import path from 'path'

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const assetId = parseInt(id)

  const formData = await req.formData()
  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!(file.type in ALLOWED)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })

  const ext = ALLOWED[file.type]
  const filename = `${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets', String(assetId))
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  const photo = await (prisma as any).assetPhoto.create({
    data: { assetId, path: `/uploads/assets/${assetId}/${filename}` },
  })

  return NextResponse.json({ photo })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!hasRole(session.role, 'ASSET_CONTROL')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const photoId = parseInt(searchParams.get('photoId') ?? '')
  if (!photoId) return NextResponse.json({ error: 'Missing photoId' }, { status: 400 })

  const photo = await (prisma as any).assetPhoto.findUnique({ where: { id: photoId } })
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try { await fs.unlink(path.join(process.cwd(), 'public', photo.path)) } catch {}
  await (prisma as any).assetPhoto.delete({ where: { id: photoId } })

  return NextResponse.json({ ok: true })
}
