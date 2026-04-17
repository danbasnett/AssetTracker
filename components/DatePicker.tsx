'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function parseYMD(s: string): Date | null {
  if (!s) return null
  const [y,m,d] = s.split('-').map(Number)
  if (!y||!m||!d) return null
  return new Date(y, m-1, d)
}

export default function DatePicker({ value, onChange, name, placeholder, className }: {
  value?: string
  onChange?: (val: string) => void
  name?: string
  placeholder?: string
  className?: string
}) {
  const isControlled = value !== undefined
  const [internalVal, setInternalVal] = useState(value ?? '')
  const val = isControlled ? (value ?? '') : internalVal

  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 256 })
  const parsed = parseYMD(val)
  const today = new Date()
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function openPicker() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const popupHeight = 320
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow >= popupHeight
        ? rect.bottom + window.scrollY + 4
        : rect.top + window.scrollY - popupHeight - 4
      setPopupStyle({ top, left: rect.left + window.scrollX, width: Math.max(rect.width, 256) })
    }
    setOpen(o => !o)
  }

  function select(y: number, m: number, d: number) {
    const date = new Date(y, m, d)
    const s = toYMD(date)
    if (!isControlled) setInternalVal(s)
    onChange?.(s)
    setOpen(false)
  }

  function clear() {
    if (!isControlled) setInternalVal('')
    onChange?.('')
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1) }
    else setViewMonth(m => m-1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1) }
    else setViewMonth(m => m+1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate()
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth},(_,i)=>i+1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const displayVal = parsed
    ? `${parsed.getDate()} ${MONTHS[parsed.getMonth()].slice(0,3)} ${parsed.getFullYear()}`
    : ''

  const popup = open ? (
    <div ref={popupRef}
      className="fixed z-[9999] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl p-3 w-64"
      style={{ top: popupStyle.top, left: popupStyle.left }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <select value={viewMonth} onChange={e => setViewMonth(+e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-1 py-0.5 focus:outline-none">
            {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <input type="number" value={viewYear} onChange={e => setViewYear(+e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-1 py-0.5 w-16 focus:outline-none text-center" />
        </div>
        <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs text-zinc-500 py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isSelected = parsed?.getFullYear()===viewYear && parsed?.getMonth()===viewMonth && parsed?.getDate()===day
          const isToday = today.getFullYear()===viewYear && today.getMonth()===viewMonth && today.getDate()===day
          return (
            <button key={i} type="button" onClick={() => select(viewYear, viewMonth, day)}
              className={`text-xs rounded-lg py-1.5 transition-colors ${
                isSelected ? 'bg-white text-black font-medium' :
                isToday ? 'bg-zinc-700 text-white' :
                'text-zinc-300 hover:bg-zinc-800'
              }`}>
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between mt-3 pt-2 border-t border-zinc-800">
        <button type="button" onClick={() => select(today.getFullYear(), today.getMonth(), today.getDate())}
          className="text-xs text-zinc-400 hover:text-white">Today</button>
        {val && (
          <button type="button" onClick={clear}
            className="text-xs text-zinc-400 hover:text-white">Clear</button>
        )}
      </div>
    </div>
  ) : null

  return (
    <div className={`relative ${className ?? ''}`}>
      {name && <input type="hidden" name={name} value={val} />}
      <button
        ref={buttonRef}
        type="button"
        onClick={openPicker}
        className="w-full flex items-center justify-between rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-left focus:outline-none focus:border-zinc-500 hover:border-zinc-600 transition-colors"
      >
        <span className={displayVal ? 'text-white' : 'text-zinc-500'}>{displayVal || placeholder || 'Select date'}</span>
        <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {open && typeof document !== 'undefined' && createPortal(popup, document.body)}
    </div>
  )
}
