'use client'

import { useActionState, useTransition, useState } from 'react'
import { createUser, deleteUser, changePassword, changeUserRole } from '../app/actions'

const ROLE_LABELS: Record<string, string> = {
  VIEW_ONLY: 'View only',
  ASSET_CONTROL: 'Asset control',
  MANAGEMENT: 'Management',
  ADMIN: 'Admin',
}

type User = {
  id: number
  username: string
  role: string
  createdAt: Date
  lastLoginAt: Date | null
}

function ChangeRoleSelect({ user, currentUserId }: { user: User; currentUserId: number }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (user.id === currentUserId) return null

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value
    setError(null)
    const formData = new FormData()
    formData.append('id', String(user.id))
    formData.append('role', role)
    startTransition(async () => {
      const result = await changeUserRole(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        key={user.role}
        defaultValue={user.role}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-white border border-zinc-700 focus:outline-none focus:border-zinc-500 disabled:opacity-50">
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}

function DeleteUserButton({ id, currentUserId }: { id: number; currentUserId: number }) {
  const [, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this user? This cannot be undone.')) return
    const formData = new FormData()
    formData.append('id', String(id))
    startTransition(async () => { await deleteUser(null, formData) })
  }

  if (id === currentUserId) return (
    <span className="text-xs text-zinc-600">current</span>
  )

  return (
    <button type="button" onClick={handleDelete}
      className="rounded-lg bg-zinc-800 px-3 py-1 text-zinc-400 text-xs hover:bg-red-900 hover:text-red-300">
      Remove
    </button>
  )
}

function ChangePasswordRow({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(changePassword, null)

  return (
    <div>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="text-xs text-zinc-500 hover:text-zinc-300 underline">
        {open ? 'Cancel' : 'Reset password'}
      </button>
      {open && (
        <form action={formAction} className="mt-2 flex flex-wrap gap-2 items-center">
          <input type="hidden" name="id" value={user.id} />
          <input name="newPassword" type="password" placeholder="New password (12+ chars)" required
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white text-xs border border-zinc-700 focus:outline-none focus:border-zinc-500 w-52" />
          <input name="confirm" type="password" placeholder="Confirm" required
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white text-xs border border-zinc-700 focus:outline-none focus:border-zinc-500 w-36" />
          <button type="submit"
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-white text-xs hover:bg-zinc-600">
            Save
          </button>
          {state?.error && <span className="text-red-400 text-xs w-full">{state.error}</span>}
          {state?.success && <span className="text-green-400 text-xs w-full">Password updated</span>}
        </form>
      )}
    </div>
  )
}

export default function SettingsUserList({ users, currentUserId }: { users: User[]; currentUserId: number }) {
  const [state, formAction] = useActionState(createUser, null)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
        {users.length === 0 ? (
          <p className="px-6 py-4 text-zinc-400 text-sm">No users found.</p>
        ) : (
          users.map(user => (
            <div key={user.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{user.username}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Added {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    {user.lastLoginAt && ` · Last login ${new Date(user.lastLoginAt).toLocaleDateString('en-GB')}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <ChangeRoleSelect user={user} currentUserId={currentUserId} />
                  {user.id === currentUserId && (
                    <span className="text-xs text-zinc-500">{ROLE_LABELS[user.role] ?? user.role}</span>
                  )}
                  <DeleteUserButton id={user.id} currentUserId={currentUserId} />
                </div>
              </div>
              <div className="mt-2">
                <ChangePasswordRow user={user} />
              </div>
            </div>
          ))
        )}
      </div>

      <form action={formAction} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
        <h3 className="text-sm font-medium text-zinc-400">Add User</h3>
        <div className="flex flex-wrap gap-2">
          <input name="username" placeholder="Username" required
            className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-40" />
          <input name="password" type="password" placeholder="Password (12+ chars)" required
            className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-52" />
          <input name="confirm" type="password" placeholder="Confirm" required
            className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 w-36" />
          <select name="role" defaultValue="VIEW_ONLY"
            className="rounded-xl bg-zinc-800 px-3 py-2 text-white text-sm border border-zinc-700 focus:outline-none focus:border-zinc-500">
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit"
            className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
            Add
          </button>
        </div>
        {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
        {state?.success && <p className="text-green-400 text-sm">User created</p>}
      </form>
    </div>
  )
}
