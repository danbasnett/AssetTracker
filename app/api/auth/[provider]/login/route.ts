import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

// Built-in defaults for well-known providers
const BUILTIN: Record<string, { authUrl: string; scope: string; extra?: Record<string, string> }> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    extra: { access_type: 'online', prompt: 'select_account' },
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    scope: 'openid email name',
    extra: { response_mode: 'form_post', response_type: 'code id_token' },
  },
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const db = await (prisma as any).oAuthProvider.findUnique({ where: { name: provider } })
  if (!db?.enabled) return new NextResponse('Provider not configured', { status: 400 })

  const builtin = BUILTIN[provider]
  const authUrl = db.authUrl || builtin?.authUrl
  const scope = db.scope || builtin?.scope || 'openid email profile'

  if (!authUrl) return new NextResponse('No authorization URL configured for this provider', { status: 400 })

  const state = crypto.randomBytes(16).toString('hex')
  const from = req.nextUrl.searchParams.get('from') || '/'
  const origin = req.nextUrl.origin
  const callbackUrl = `${origin}/api/auth/${provider}/callback`

  const url = new URL(authUrl)
  url.searchParams.set('client_id', db.clientId)
  url.searchParams.set('redirect_uri', callbackUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)
  url.searchParams.set('state', state)

  // Apply built-in extras (e.g. Apple's response_mode)
  if (builtin?.extra) {
    for (const [k, v] of Object.entries(builtin.extra)) url.searchParams.set(k, v)
  }

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('oauth_state', `${state}:${encodeURIComponent(from)}:${origin}`, {
    httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax',
  })
  return res
}
