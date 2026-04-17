'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Zap, ZapOff } from 'lucide-react'

type Props = {
  onResult: (text: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const [error, setError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    if (!isSecure) {
      setError('Camera access requires HTTPS. Connect via your domain with SSL enabled.')
      return
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        const caps = track.getCapabilities?.() as any
        if (caps?.torch) setTorchAvailable(true)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        if (cancelled) return

        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()

        if (!videoRef.current || cancelled) return

        const controls = await reader.decodeFromStream(
          stream,
          videoRef.current,
          (result) => {
            if (result && !cancelled) onResultRef.current(result.getText())
          }
        )

        if (cancelled) {
          controls.stop()
        } else {
          controlsRef.current = controls
        }
      } catch (e: any) {
        if (cancelled) return
        if (e.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings.')
        } else if (e.name === 'NotFoundError') {
          setError('No camera found on this device.')
        } else {
          setError('Could not start camera: ' + (e.message ?? String(e)))
        }
      }
    }

    start()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] })
      setTorchOn(v => !v)
    } catch {
      // torch not supported on this device
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80">
        <span className="text-white font-medium">Scan barcode or QR code</span>
        <div className="flex items-center gap-2">
          {torchAvailable && (
            <button onClick={toggleTorch} className="p-1.5 text-zinc-400 hover:text-white">
              {torchOn ? <Zap size={20} className="text-yellow-400" /> : <ZapOff size={20} />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-44 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br" />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/60 animate-scan" />
          </div>
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
            <p className="text-white text-center text-sm">{error}</p>
          </div>
        )}
      </div>

      <p className="text-center text-zinc-400 text-sm py-4 bg-zinc-900/80">
        Point your camera at a barcode or QR code
      </p>

      <style>{`
        @keyframes scan {
          0%   { top: 0; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
