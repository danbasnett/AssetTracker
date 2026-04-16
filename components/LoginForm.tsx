'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, createFirstUser } from '../app/actions'

export default function LoginForm({ isFirstTime, from, logoUrl }: { isFirstTime: boolean; from: string; logoUrl?: string }) {
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
      </div>
    </div>
  )
}
