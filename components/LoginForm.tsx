'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, createFirstUser } from '../app/actions'

type SsoProvider = { name: string; label: string }

export default function LoginForm({ isFirstTime, from, logoUrl, ssoProviders = [] }: { isFirstTime: boolean; from: string; logoUrl?: string; ssoProviders?: SsoProvider[] }) {
  const [loginState, loginAction] = useActionState(login, null)
  const [setupState, setupAction] = useActionState(createFirstUser, null)
  const router = useRouter()

  const state = isFirstTime ? setupState : loginState

  useEffect(() => {
    if ((state as any)?.success) router.push(from || '/')
  }, [state])

  const logo = logoUrl ? (
    <img src={logoUrl} alt="Logo" className="max-h-24 max-w-full object-contain mb-8" />
  ) : null

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {logo}
          <h1 className="text-2xl font-semibold text-white mb-1">Welcome</h1>
          <p className="text-zinc-400 text-sm mb-8">Create your admin account to get started.</p>

          <form action={setupAction} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Username</label>
              <input name="username" required autoComplete="username"
                className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password</label>
              <input name="password" type="password" required autoComplete="new-password"
                className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500" />
              <p className="mt-1 text-xs text-zinc-500">Minimum 12 characters</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirm password</label>
              <input name="confirm" type="password" required autoComplete="new-password"
                className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500" />
            </div>

            {setupState?.error && (
              <p className="text-red-400 text-sm">{setupState.error}</p>
            )}

            <button type="submit"
              className="w-full rounded-xl bg-white px-4 py-2.5 text-black font-medium hover:bg-zinc-200">
              Create Account
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {logo}
        <h1 className="text-2xl font-semibold text-white mb-1">Sign in</h1>
        <p className="text-zinc-400 text-sm mb-8">Asset Tracker</p>

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Username</label>
            <input name="username" required autoComplete="username"
              className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500" />
          </div>

          {(loginState as any)?.error && (
            <p className="text-red-400 text-sm">{(loginState as any).error}</p>
          )}

          <button type="submit"
            className="w-full rounded-xl bg-white px-4 py-2.5 text-black font-medium hover:bg-zinc-200">
            Sign in
          </button>
        </form>

        {ssoProviders.length > 0 && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-950 px-3 text-xs text-zinc-500">or continue with</span>
              </div>
            </div>
            <div className="space-y-2">
              {ssoProviders.map(p => (
                <a
                  key={p.name}
                  href={`/api/auth/${p.name}/login?from=${encodeURIComponent(from)}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition-colors"
                >
                  {p.name === 'google' && (
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                      <path d="M43.6 24.5c0-1.5-.1-3-.4-4.5H24v8.5h11C34.5 31 33 33 31 34.3v3.5h5.5c3.2-3 5.1-7.4 5.1-13.3z" fill="#4285F4"/>
                      <path d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-5.5-3.5C30 37 27.1 38 24 38c-5.4 0-10-3.6-11.6-8.5H6.6v3.6C10 41.5 16.6 44 24 44z" fill="#34A853"/>
                      <path d="M12.4 29.5c-.4-1.2-.7-2.5-.7-3.8s.3-2.6.7-3.8v-3.6H6.6C5.3 20.8 4.5 23.3 4.5 26s.8 5.2 2.1 7.1l5.8-3.6z" fill="#FBBC05"/>
                      <path d="M24 13.5c3 0 5.7 1 7.8 3L37 11.3C33.4 7.9 28.9 6 24 6 16.6 6 10 10.5 6.6 18.1l5.8 3.6C14 16.1 18.6 13.5 24 13.5z" fill="#EA4335"/>
                    </svg>
                  )}
                  {p.name === 'apple' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  )}
                  Sign in with {p.label}
                </a>
              ))}

            </div>
          </>
        )}
      </div>
    </div>
  )
}
