'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import { Home, Package, MapPin, ChevronLeft, ChevronRight, Table, Settings, ClipboardList, LogOut, Users, Wrench, ScrollText, LayoutTemplate } from 'lucide-react'
import { useTransition } from 'react'
import { logout } from '../app/actions'
import type { Role } from '../lib/session'
import SidebarAvatar from './SidebarAvatar'

const LABEL_CLASS = (collapsed: boolean) =>
  `whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out ${
    collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[160px] opacity-100 ml-3'
  }`

export default function Sidebar({ logoUrl, userRole, username, avatarUrl }: { logoUrl?: string; userRole: Role; username: string; avatarUrl?: string }) {
  const pathname = usePathname()
  const { collapsed, setCollapsed } = useSidebar()
  const [, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => { await logout() })
  }

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/assets', label: 'Assets', icon: Table },
    { href: '/locations', label: 'Locations', icon: MapPin },
    { href: '/items', label: 'Consumables', icon: Package },
    { href: '/allocations', label: 'Allocations', icon: ClipboardList },
    { href: '/people', label: 'People', icon: Users },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/models', label: 'Models', icon: LayoutTemplate },
  ]

  const navLinkClass = (href: string) =>
    `flex items-center px-3 py-2 rounded-lg text-sm ${
      pathname === href ? 'bg-white text-black font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`

  const bottomBtnClass = `flex items-center px-3 py-2 rounded-lg text-sm mt-1 w-full text-zinc-400 hover:text-white hover:bg-zinc-800`

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden md:flex flex-col fixed top-0 left-0 h-screen bg-zinc-900 border-r border-zinc-800 p-4 overflow-hidden transition-[width] duration-200 ease-in-out ${collapsed ? 'w-20' : 'w-48'}`}>

        {/* Logo / title */}
        <div className="relative h-10 mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="absolute top-1/2 -translate-y-1/2 left-0 h-10 w-auto" />
          ) : (
            <div className="flex items-center h-full px-3">
              <span className={`font-semibold text-lg text-white ${LABEL_CLASS(collapsed)}`}>
                Asset System
              </span>
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {links.map(link => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                <Icon size={22} className="shrink-0" />
                <span className={LABEL_CLASS(collapsed)}>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom items */}
        <SidebarAvatar username={username} avatarUrl={avatarUrl} collapsed={collapsed} />
        {userRole === 'ADMIN' && (
          <Link href="/audit" className={navLinkClass('/audit')}>
            <ScrollText size={22} className="shrink-0" />
            <span className={LABEL_CLASS(collapsed)}>Audit Log</span>
          </Link>
        )}
        {userRole === 'ADMIN' && (
          <Link href="/settings" className={navLinkClass('/settings')}>
            <Settings size={22} className="shrink-0" />
            <span className={LABEL_CLASS(collapsed)}>Settings</span>
          </Link>
        )}
        <button onClick={handleLogout} className={bottomBtnClass}>
          <LogOut size={22} className="shrink-0" />
          <span className={LABEL_CLASS(collapsed)}>Sign out</span>
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className={bottomBtnClass}>
          {collapsed ? <ChevronRight size={22} className="shrink-0" /> : <ChevronLeft size={22} className="shrink-0" />}
          <span className={LABEL_CLASS(collapsed)}>Collapse</span>
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="flex overflow-x-auto scrollbar-none px-1 py-2">
          {[...links, ...(userRole === 'ADMIN' ? [{ href: '/audit', label: 'Audit', icon: ScrollText }, { href: '/settings', label: 'Settings', icon: Settings }] : [])].map(link => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg shrink-0 ${
                  pathname === link.href ? 'text-white' : 'text-zinc-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] leading-tight">{link.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg shrink-0 text-zinc-400"
          >
            <LogOut size={20} />
            <span className="text-[10px] leading-tight">Sign out</span>
          </button>
        </div>
      </div>
    </>
  )
}
