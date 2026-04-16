'use client'

import { useSidebar } from './SidebarContext'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <main className={`w-full pb-20 md:pb-0 transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-48'}`}>
      {children}
    </main>
  )
}
