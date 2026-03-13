"use client";

import { useEffect } from "react";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";
import { Toaster } from "@/components/ui/toaster";

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  // רישום ה-Service Worker לחסינות אינטרנט חלש (Offline)
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.hostname !== "localhost") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => console.log("Saban SW Active:", registration.scope),
          (err) => console.log("SW Registration failed:", err)
        );
      });
    }
  }, []);

  return (
    <html lang="he" dir="rtl">
      <head>
        {/* הגדרות PWA למובייל */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B2C63" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Saban OS" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${heebo.variable} font-sans antialiased`}>
        <BusinessConfigProvider>
          <ChatActionsProvider>
            {children}
            <Toaster />
          </ChatActionsProvider>
        </BusinessConfigProvider>

        {/* סקריפט סאונד לאישור פעולות */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.playSuccessSound = () => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.1);
          };
        `}} />
      </body>
    </html>
  );
}
