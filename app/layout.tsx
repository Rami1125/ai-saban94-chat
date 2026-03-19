import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import Script from "next/script";

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "Saban OS - ח. סבן לוגיסטיקה",
  description: "מערכת ניהול ולוגיסטיקה חכמה",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saban OS",
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
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* OneSignal SDK */}
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
                safari_web_id: "web.onesignal.auto.5f4f9ed9-fb2e-4d6a-935d-81aa46fccce0",
                notifyButton: { enable: true },
              });
            });
          `}
        </Script>
      </head>
      <body className={`${heebo.variable} font-sans antialiased bg-slate-50`}>
        <BusinessConfigProvider>
          <ChatActionsProvider>
            {children}
            <Toaster />
            <ServiceWorkerRegistrar />
          </ChatActionsProvider>
        </BusinessConfigProvider>

        {/* מערכת סאונד - צלצול התראה איכותי */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.playNotificationSound = () => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (freq, start, duration) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
              gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
              osc.connect(gain); gain.connect(ctx.destination);
              osc.start(ctx.currentTime + start);
              osc.stop(ctx.currentTime + start + duration);
            };
            // צליל כפול נעים (Notification Ding)
            playTone(880, 0, 0.1);
            playTone(1046, 0.1, 0.2);
          };
        `}} />
      </body>
    </html>
  );
}
