'use client'

import { useState } from 'react'
import { ScanLine } from 'lucide-react'
import dynamic from 'next/dynamic'
const BarcodeScanner = dynamic(() => import('./BarcodeScanner'), { ssr: false })

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  showScan?: boolean
  className?: string
}

export default function SearchBar({ value, onChange, showScan = true, className }: SearchBarProps) {
  const [scanning, setScanning] = useState(false)

  return (
    <>
      {scanning && (
        <BarcodeScanner
          onResult={text => { onChange(text); setScanning(false) }}
          onClose={() => setScanning(false)}
        />
      )}
      <div className={`relative flex items-center ${className ?? ''}`}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search..."
          className={`w-full rounded-xl bg-zinc-800 pl-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 ${showScan ? 'pr-10' : 'pr-4'}`}
        />
        {showScan && (
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="absolute right-3 text-zinc-500 hover:text-white transition-colors"
            title="Scan barcode"
          >
            <ScanLine size={16} />
          </button>
        )}
      </div>
    </>
  )
}
