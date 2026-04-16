'use client'

import { useState } from 'react'

export default function CounterCard() {
  const [count, setCount] = useState(0)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">Test Button</p>
      <p className="mt-2 text-3xl font-semibold">{count}</p>

      <button
        onClick={() => setCount(count + 1)}
        className="mt-4 rounded-xl bg-white px-4 py-2 text-black"
      >
        Add 1
      </button>
    </div>
  )
}