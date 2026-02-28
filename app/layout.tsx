import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin", "hebrew"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ח. סבן AI - אסיסטנט טכני",
  description: "מומחה ה-AI האישי שלך למוצרי איטום, בנייה וחישובי כמויות מבית ח. סבן.",
  generator: "SabanOS-v2",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "סבן AI",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png", // וודא שיש לך קובץ כזה ב-public בגודל 180x180
  },
}

export const viewport: Viewport = {
  themeColor: "#0B2C63", // הכחול של סבן
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // מאפשר לאפליקציה למלא את כל המסך כולל ה"נוץ'" באייפון
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased bg-stone-50 overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
