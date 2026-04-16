'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import { Home, Package, MapPin, ChevronLeft, ChevronRight, Table } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const [showLabels, setShowLabels] = useState(true)

  useEffect(() => {
    if (collapsed) {
      setShowLabels(false)
    } else {
      const timer = setTimeout(() => setShowLabels(true), 250)
      return () => clearTimeout(timer)
    }
  }, [collapsed])

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/assets', label: 'Assets', icon: Table },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/items', label: 'Item', icon: Package}
  ]

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col fixed top-0 left-0 h-screen bg-zinc-900 border-r border-zinc-800 p-4 ${collapsed ? 'w-20' : 'w-48'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-6 text-zinc-400 hover:text-white w-full flex items-center justify-start">
          {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </button>

        <div className="h-8 mb-4">
          {showLabels && (
            <h1 className="text-white font-semibold text-lg whitespace-nowrap">
              Asset System
            </h1>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(link => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  collapsed ? 'justify-center' : 'gap-3'
                } ${
                  pathname === link.href
                    ? 'bg-white text-black font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon size={22} />
                {showLabels && (
                  <span className="whitespace-nowrap">{link.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around p-3 z-50">
        {links.map(link => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg text-xs ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-zinc-400'
              }`}
            >
              <Icon size={22} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
