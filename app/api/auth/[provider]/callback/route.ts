import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getSession } from '../../../../../lib/session'
import type { Role } from '../../../../../lib/session'

// Built-in token/userinfo endpoints
const BUILTIN_TOKEN: Record<string, string> = {
  google: 'https://oauth2.googleapis.com/token',
  apple:  'https://appleid.apple.com/auth/token',
}
const BUILTIN_USERINFO: Record<string, string> = {
  google: 'https://www.googleapis.com/oauth2/v3/userinfo',
}

// ── Token exchange ────────────────────────────────────────────────────────────

async function exchangeCode(tokenUrl: string, code: string, clientId: string, clientSecret: string, callbackUrl: string) {
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl, grant_type: 'authorization_code' }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

async function appleClientSecret(db: any) {
  const { SignJWT, importPKCS8 } = await import('jose')
  const privateKey = await importPKCS8(db.applePrivKey.replace(/\\n/g, '\n'), 'ES256')
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: db.appleKeyId })
    .setIssuer(db.appleTeamId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('https://appleid.apple.com')
    .setSubject(db.clientId)
    .sign(privateKey)
}

function decodeJwtPayload(jwt: string): any {
  return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())
}

// ── Per-provider user info extraction ────────────────────────────────────────

async function resolveUser(provider: string, db: any, code: string, idToken: string | null, callbackUrl: string): Promise<{ email: string; name: string }> {
  const tokenUrl = db.tokenUrl || BUILTIN_TOKEN[provider]
  const userinfoUrl = db.userinfoUrl || BUILTIN_USERINFO[provider]

  if (!tokenUrl) throw new Error('No token URL configured for this provider')

  // Apple: special client_secret JWT
  if (provider === 'apple') {
    const clientSecret = await appleClientSecret(db)
    const tokens = await fetch(BUILTIN_TOKEN.apple, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: db.clientId, client_secret: clientSecret, redirect_uri: callbackUrl, grant_type: 'authorization_code' }),
    }).then(r => { if (!r.ok) throw new Error('Apple token exchange failed'); return r.json() })

    const payload = decodeJwtPayload(tokens.id_token || idToken)
    if (!payload.email) throw new Error('No email in Apple id_token')
    return { email: payload.email, name: payload.email.split('@')[0] }
  }

  // Standard OAuth2 / OIDC
  const tokens = await exchangeCode(tokenUrl, code, db.clientId, db.clientSecret, callbackUrl)

  // Try id_token first (OIDC)
  if (tokens.id_token) {
    const payload = decodeJwtPayload(tokens.id_token)
    if (payload.email) return { email: payload.email, name: payload.name || payload.preferred_username || payload.email.split('@')[0] }
  }

  // Fall back to userinfo endpoint
  if (userinfoUrl) {
    const userRes = await fetch(userinfoUrl, { headers: { Authorization: `Bearer ${tokens.access_token}` } })
    if (!userRes.ok) throw new Error('Failed to fetch user info')
    const u = await userRes.json()
    const email = u.email || u.mail || u.upn
    if (!email) throw new Error('Provider did not return an email address')
    return { email, name: u.name || u.display_name || u.preferred_username || email.split('@')[0] }
  }

  throw new Error('No userinfo URL configured and provider returned no id_token with email')
}

// ── Session creation ──────────────────────────────────────────────────────────

async function createSession(email: string, name: string, defaultRole: string, origin: string, from: string) {
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    let username = name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || email.split('@')[0]
    if (await prisma.user.findUnique({ where: { username } })) username = `${username}_${Date.now()}`
    user = await prisma.user.create({ data: { username, email, passwordHash: '*', role: defaultRole as any } })
  }

  const session = await getSession()
  session.userId = user.id
  session.username = user.username
  session.role = user.role as Role
  session.isLoggedIn = true
  await session.save()

  const res = NextResponse.redirect(`${origin}${from}`)
  res.cookies.delete('oauth_state')
  return res
}

// ── Shared callback handler ───────────────────────────────────────────────────

async function handleCallback(provider: string, code: string, state: string, idToken: string | null, req: NextRequest) {
  const stateCookie = req.cookies.get('oauth_state')?.value
  if (!stateCookie) throw new Error('Missing state cookie — try signing in again')
  const [savedState, encodedFrom, origin] = stateCookie.split(':')
  if (savedState !== state) throw new Error('State mismatch')
  const from = decodeURIComponent(encodedFrom || '/')
  const callbackUrl = `${origin}/api/auth/${provider}/callback`

  const db = await (prisma as any).oAuthProvider.findUnique({ where: { name: provider } })
  if (!db?.enabled) throw new Error('Provider not configured')

  const { email, name } = await resolveUser(provider, db, code, idToken, callbackUrl)
  return createSession(email, name, db.defaultRole, origin, from)
}

function errorRedirect(req: NextRequest, msg: string) {
  return NextResponse.redirect(`${req.nextUrl.origin}/login?error=${encodeURIComponent(msg)}`)
}

// ── GET (standard OAuth2 / OIDC) ─────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) return errorRedirect(req, searchParams.get('error') || 'OAuth failed')

  try {
    return await handleCallback(provider, code, state, null, req)
  } catch (e: any) {
    return errorRedirect(req, e.message || 'OAuth error')
  }
}

// ── POST (Apple form_post) ────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const body = await req.formData()
  const code = body.get('code') as string | null
  const state = body.get('state') as string | null
  const idToken = body.get('id_token') as string | null

  if (!code || !state) return errorRedirect(req, 'OAuth failed')

  try {
    return await handleCallback(provider, code, state, idToken, req)
  } catch (e: any) {
    return errorRedirect(req, e.message || 'OAuth error')
  }
}
