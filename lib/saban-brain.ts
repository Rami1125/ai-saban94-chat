// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders"; // ניצור אותו מיד

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "סידור ח.סבן",
  description: "מערכת ניהול ולוגיסטיקה חכמה",
  icons: {
    icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A',
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "סידור",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B2C63",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased bg-slate-50`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
