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
  title: "סידור ח.סבן",
  description: "מערכת ניהול ולוגיסטיקה חכמה",
  icons: {
    icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wA=',
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
      <head>
        {/* הגנה מוקדמת על IndexedDB למניעת שגיאת OneSignal בקונסול */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            var dbCheck = function() {
              try {
                var request = window.indexedDB.open("onesignal_db_check");
                request.onerror = function() { window.isIndexedDBAvailable = false; };
                request.onsuccess = function() { window.isIndexedDBAvailable = true; };
              } catch(e) { window.isIndexedDBAvailable = false; }
            };
            dbCheck();
          })();
        `}} />
        
<Script id="onesignal-init" strategy="afterInteractive">
  {`
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      // בדיקה אם הדפדפן תומך ומאפשר
      if (!window.indexedDB) {
        console.warn("SabanOS: OneSignal disabled - No IndexedDB");
        return;
      }
      
      try {
        await OneSignal.init({
          appId: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
          safari_web_id: "web.onesignal.auto.5f4f9ed9-fb2e-4d6a-935d-81aa46fccce0",
          notifyButton: { enable: true },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: "/" }, // מבטיח שהוורקר יירשם בנתיב הנכון
          serviceWorkerPath: "OneSignalSDKWorker.js"
        });

        // וידוא שהוורקר מוכן לפני שליחת הודעות
        const registration = await navigator.serviceWorker.ready;
        console.log("SabanOS: OneSignal Service Worker is ready!", registration);
        
      } catch (err) {
        console.error("SabanOS: OneSignal Init Error:", err);
      }
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

        {/* מערכת סאונד סבן */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.playNotificationSound = () => {
            try {
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (!AudioContextClass) return;
              const ctx = new AudioContextClass();
              const playTone = (freq, start, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
                osc.connect(gain); 
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duration);
              };
              if (ctx.state === 'suspended') {
                ctx.resume().then(() => { playTone(880, 0, 0.1); playTone(1046, 0.1, 0.2); });
              } else {
                playTone(880, 0, 0.1); playTone(1046, 0.1, 0.2);
              }
            } catch (e) {}
          };
        `}} />
      </body>
    </html>
  );
}
