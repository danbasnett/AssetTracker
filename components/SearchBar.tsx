'use client'

import { useState } from 'react'
import { ScanLine } from 'lucide-react'
import dynamic from 'next/dynamic'
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false })

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [scanning, setScanning] = useState(false)

  return (
    <>
      {scanning && (
        <BarcodeScanner
          onResult={text => { onChange(text); setScanning(false) }}
          onClose={() => setScanning(false)}
        />
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search..."
          className="rounded-xl bg-zinc-800 pl-4 pr-10 py-2 text-white placeholder-zinc-500 border border-zinc-700 w-64"
        />
        <button
          type="button"
          onClick={() => setScanning(true)}
          className="absolute right-3 text-zinc-500 hover:text-white transition-colors"
          title="Scan barcode"
        >
          <ScanLine size={16} />
        </button>
      </div>
    </>
  )
}
