import Sidebar from '../components/Sidebar'
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from '../components/SidebarContext'
import LayoutWrapper from '../components/LayoutWrapper'

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider>
          <div className="flex">
            <Sidebar />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
