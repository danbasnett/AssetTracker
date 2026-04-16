'use client'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
      placeholder="Search..."
      className="rounded-xl bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 border border-zinc-700 w-64"
    />
  )
}
