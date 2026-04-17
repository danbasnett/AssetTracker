import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'logoPath' } })
    const url = setting?.value?.split('?')[0] ?? null
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ url: null }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
