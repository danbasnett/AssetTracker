import Sidebar from '../components/Sidebar'
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from '../components/SidebarContext'
import LayoutWrapper from '../components/LayoutWrapper'
import { getSession } from '../lib/session'
import { prisma } from '../lib/prisma'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Asset System",
  description: "Asset management system",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  const [logoSetting, currentUser] = session.isLoggedIn
    ? await Promise.all([
        prisma.setting.findUnique({ where: { key: 'logoPath' } }).catch(() => null),
        prisma.user.findUnique({ where: { id: session.userId }, select: { avatarPath: true } }).catch(() => null),
      ])
    : [null, null]
  const userRole = session.isLoggedIn ? session.role : null

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {session.isLoggedIn ? (
          <SidebarProvider>
            <div className="flex">
              <Sidebar
                logoUrl={logoSetting?.value ?? undefined}
                userRole={userRole ?? 'VIEW_ONLY'}
                username={session.username}
                avatarUrl={currentUser?.avatarPath ?? undefined}
              />
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </div>
          </SidebarProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
