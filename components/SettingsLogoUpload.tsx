'use client'

import { useActionState, useTransition, useState } from 'react'
import { uploadLogo, removeLogo } from '../app/actions'
import Image from 'next/image'

export default function SettingsLogoUpload({ currentLogoUrl }: { currentLogoUrl?: string }) {
  const [state, formAction] = useActionState(uploadLogo, null)
  const [preview, setPreview] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function handleRemove() {
    startTransition(async () => { await removeLogo() })
  }

  const displayUrl = preview ?? currentLogoUrl

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      {displayUrl && (
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-zinc-800 p-3 flex items-center justify-center h-16 w-40">
            <img src={displayUrl} alt="Logo preview" className="max-h-10 max-w-full object-contain" />
          </div>
          {!preview && currentLogoUrl && (
            <button type="button" onClick={handleRemove}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-zinc-400 text-sm hover:bg-red-900 hover:text-red-300">
              Remove
            </button>
          )}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap gap-2 items-center">
        <label className="cursor-pointer rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-700">
          Choose file
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        <button type="submit"
          className="rounded-xl bg-white px-4 py-2 text-black text-sm font-medium hover:bg-zinc-200">
          Upload
        </button>
        <span className="text-xs text-zinc-500">PNG, JPEG, WebP or SVG · max 2 MB</span>
      </form>

      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-400 text-sm">Logo updated</p>}
    </div>
  )
}
