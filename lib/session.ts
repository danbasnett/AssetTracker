import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SessionOptions } from 'iron-session'

export type Role = 'VIEW_ONLY' | 'ASSET_CONTROL' | 'MANAGEMENT' | 'ADMIN'

export interface SessionData {
  userId: number
  username: string
  role: Role
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'assettracker-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

const ROLE_LEVEL: Record<Role, number> = {
  VIEW_ONLY: 0,
  ASSET_CONTROL: 1,
  MANAGEMENT: 2,
  ADMIN: 3,
}

export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required]
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')
  return session
}

export async function requireRole(required: Role) {
  const session = await requireAuth()
  if (!hasRole(session.role, required)) redirect('/')
  return session
}
