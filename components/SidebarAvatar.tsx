'use client'

import { useTransition, useRef } from 'react'
import { uploadAvatar } from '../app/actions'

export default function SidebarAvatar({
  username,
  avatarUrl,
  collapsed,
}: {
  username: string
  avatarUrl?: string
  collapsed: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    startTransition(async () => {
      await uploadAvatar(null, formData)
    })
    e.target.value = ''
  }

  const initial = username[0]?.toUpperCase() ?? '?'

  const LABEL_CLASS = `whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${
    collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[160px] opacity-100 ml-3'
  }`

  return (
    <div className="flex items-center px-3 py-2 mb-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        title="Change profile picture"
        className="relative shrink-0 rounded-full focus:outline-none group disabled:opacity-50"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center ring-2 ring-transparent group-hover:ring-zinc-500 transition-all">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-white">{initial}</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="sr-only"
        />
      </button>
      <span className={`text-sm text-zinc-300 ${LABEL_CLASS}`}>{username}</span>
    </div>
  )
}
