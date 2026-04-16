'use client'

import { useSidebar } from './SidebarContext'
import GlobalSearch from './GlobalSearch'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div className={`w-full pb-20 md:pb-0 transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-48'}`}>
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-800/60 px-4 md:px-8 py-3 flex justify-center">
        <GlobalSearch />
      </div>
      {children}
    </div>
  )
}
