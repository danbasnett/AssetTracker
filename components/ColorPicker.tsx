'use client'

import { useState, useRef, useEffect } from 'react'


function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16)/255
  const g = parseInt(hex.slice(3,5),16)/255
  const b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  const l = (max+min)/2
  if (max===min) return [0,0,Math.round(l*100)]
  const d = max-min
  const s = l>0.5 ? d/(2-max-min) : d/(max+min)
  let h = max===r ? (g-b)/d+(g<b?6:0) : max===g ? (b-r)/d+2 : (r-g)/d+4
  return [Math.round(h*60), Math.round(s*100), Math.round(l*100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s/=100; l/=100
  const a = s*Math.min(l,1-l)
  const f = (n: number) => {
    const k=(n+h/30)%12
    return Math.round((l-a*Math.max(-1,Math.min(k-3,9-k,1)))*255).toString(16).padStart(2,'0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default function ColorPicker({ value, onChange }: {
  value: string
  onChange: (hex: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [hsl, setHsl] = useState<[number,number,number]>(() => hexToHsl(value || '#6366f1'))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setHsl(hexToHsl(value))
  }, [value])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function update(h: number, s: number, l: number) {
    const next: [number,number,number] = [h,s,l]
    setHsl(next)
    onChange(hslToHex(h,s,l))
  }

  const [h,s,l] = hsl
  const hex = hslToHex(h,s,l)

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-6 h-6 rounded-full border-2 border-zinc-600 flex-shrink-0 cursor-pointer hover:border-zinc-400 transition-colors"
        style={{ background: `conic-gradient(red, yellow, lime, cyan, blue, magenta, red)` }}
        title="Custom colour"
      />

      {open && (
        <div className="absolute z-50 mt-2 left-0 w-56 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-3 flex flex-col gap-3">
          {/* Hue */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Hue</label>
            <div className="relative h-4 rounded-full" style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}>
              <input type="range" min="0" max="360" value={h}
                onChange={e => update(+e.target.value, s, l)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                style={{ left: `calc(${h/360*100}% - 8px)`, backgroundColor: `hsl(${h},100%,50%)` }} />
            </div>
          </div>

          {/* Saturation */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Saturation</label>
            <div className="relative h-4 rounded-full"
              style={{ background: `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))` }}>
              <input type="range" min="0" max="100" value={s}
                onChange={e => update(h, +e.target.value, l)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                style={{ left: `calc(${s}% - 8px)`, backgroundColor: hex }} />
            </div>
          </div>

          {/* Lightness */}
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Lightness</label>
            <div className="relative h-4 rounded-full"
              style={{ background: `linear-gradient(to right, #000, hsl(${h},${s}%,50%), #fff)` }}>
              <input type="range" min="0" max="100" value={l}
                onChange={e => update(h, s, +e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow pointer-events-none"
                style={{ left: `calc(${l}% - 8px)`, backgroundColor: hex }} />
            </div>
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-zinc-600 flex-shrink-0" style={{ backgroundColor: hex }} />
            <input
              value={hex}
              onChange={e => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{6}$/.test(v)) { onChange(v); setHsl(hexToHsl(v)) }
              }}
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-zinc-500"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  )
}
