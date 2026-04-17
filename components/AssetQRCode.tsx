'use client'

import { useEffect, useRef } from 'react'

export default function AssetQRCode({ assetTag, assetId }: { assetTag: string; assetId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function draw() {
      const QRCode = (await import('qrcode')).default
      // Encode the full URL so scanning takes you straight to the asset
      const url = `${window.location.origin}/assets/${assetId}`
      await QRCode.toCanvas(canvasRef.current, url, {
        width: 160,
        margin: 1,
        color: { dark: '#ffffff', light: '#18181b' },
      })
    }
    draw()
  }, [assetId])

  function print() {
    const canvas = canvasRef.current
    if (!canvas) return
    const win = window.open('', '_blank')!
    win.document.write(`
      <html><head><title>Asset Label — ${assetTag}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;font-family:sans-serif}
      canvas{display:block}p{margin:8px 0 0;font-size:14px;font-weight:600;letter-spacing:.05em}</style></head>
      <body><canvas id="c"></canvas><p>${assetTag}</p><script>
        const src="${canvas.toDataURL()}";
        const c=document.getElementById('c');
        const img=new Image();img.onload=()=>{c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);setTimeout(()=>window.print(),200)};img.src=src;
      </script></body></html>`)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <canvas ref={canvasRef} className="rounded-lg" style={{ imageRendering: 'pixelated' }} />
      <button onClick={print} className="text-xs text-zinc-400 hover:text-white transition-colors">
        Print label
      </button>
    </div>
  )
}
