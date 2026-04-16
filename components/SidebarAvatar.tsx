'use client'

import { useTransition, useRef, useState } from 'react'
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
  const [localAvatarUrl, setLocalAvatarUrl] = useState(avatarUrl)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    setError(null)
    startTransition(async () => {
      const result = await uploadAvatar(null, formData)
      if ((result as any)?.error) {
        setError((result as any).error)
      } else if ((result as any)?.success) {
        // Force browser to reload the image by appending a timestamp
        setLocalAvatarUrl(prev => {
          const base = (prev ?? avatarUrl ?? '').split('?')[0]
          return base ? `${base}?t=${Date.now()}` : undefined
        })
      }
    })
    e.target.value = ''
  }

  const initial = username[0]?.toUpperCase() ?? '?'

  const LABEL_CLASS = `whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${
    collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[160px] opacity-100 ml-3'
  }`

  return (
    <div className="px-3 py-2 mb-1">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          title="Change profile picture"
          className="relative shrink-0 rounded-full focus:outline-none group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center ring-2 ring-transparent group-hover:ring-zinc-500 transition-all">
            {localAvatarUrl ? (
              <img src={localAvatarUrl} alt={username} className="w-full h-full object-cover" />
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
      {error && !collapsed && (
        <p className="mt-1 text-xs text-red-400 pl-1">{error}</p>
      )}
    </div>
  )
}
