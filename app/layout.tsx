"use client";

import { Heebo } from "next/font/google";
import "./globals.css";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";
import { Toaster } from "@/components/ui/toaster";

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans antialiased`}>
        {/* עטיפת כל האתר ב-Providers */}
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
