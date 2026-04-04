import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { StoreProvider } from "@/lib/store"
import { Toaster } from "sonner"
// Triggering fresh Vercel build without pnpm-lock.yaml

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "CMMS Pro v2.0 - Maintenance Management System",
  description: "Cloud-based Computerized Maintenance Management System for industrial operations",
}

export const viewport: Viewport = {
  themeColor: "#2c5aa0",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          {children}
          <Toaster richColors position="top-right" />
        </StoreProvider>
      </body>
    </html>
  )
}
