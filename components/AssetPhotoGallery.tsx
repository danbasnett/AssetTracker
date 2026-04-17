'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, ZoomIn } from 'lucide-react'

type Photo = { id: number; path: string }

export default function AssetPhotoGallery({
  assetId,
  initialPhotos,
  canEdit,
}: {
  assetId: number
  initialPhotos: Photo[]
  canEdit: boolean
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await fetch(`/api/assets/${assetId}/photos`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Upload failed'); return }
      setPhotos(p => [...p, data.photo])
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function deletePhoto(photoId: number) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/assets/${assetId}/photos?photoId=${photoId}`, { method: 'DELETE' })
    if (res.ok) setPhotos(p => p.filter(ph => ph.id !== photoId))
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Photos</h2>
        {canEdit && (
          <div className="flex gap-2">
            {/* Camera capture — shows on mobile as "Take Photo", on desktop as file picker */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
            <button onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1.5 text-sm rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
              <Camera size={15} /> Camera
            </button>
            {/* File picker — no capture, so it shows the gallery/file browser */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors disabled:opacity-50">
              <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-zinc-500 text-sm">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(ph => (
            <div key={ph.id} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800">
              <img src={ph.path} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => setLightbox(ph.path)}
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors">
                  <ZoomIn size={16} />
                </button>
                {canEdit && (
                  <button onClick={() => deletePhoto(ph.id)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/60 text-white transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
