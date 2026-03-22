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
  title: "ח.סבן Ai | ניהול לוגיסטי",
  description: "מערכת הבינה המלאכותית של ח.סבן - ניהול, סידור ואספקה",
  manifest: "/manifest.json",
  icons: {
    icon: "/ai.png",
    apple: "/ai.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ח.סבן Ai",
  },
};

export const viewport: Viewport = {
  themeColor: "#075e54", // צבע הוואטסאפ המקצועי (Emerald)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // מבטיח ניצול מסך מלא במובייל (ללא פסים לבנים)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* הגנה על IndexedDB ו-OneSignal */}
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
        
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
        
<Script id="onesignal-init" strategy="afterInteractive">
  {`
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
          safari_web_id: "web.onesignal.auto.5f4f9ed9-fb2e-4d6a-935d-81aa46fccce0",
          notifyButton: { enable: false }, // נכבה זמנית כדי לבדוק יציבות
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js", // וודא שזה השם המדויק ב-public
        });
        console.log("SabanOS: OneSignal Initialized!");
      } catch (err) {
        console.error("SabanOS: OneSignal Error:", err);
      }
    });
  `}
</Script>
      </head>
      
      {/* עיצוב ה-Body כרקע של וואטסאפ עם פונט היבו */}
      <body className={`${heebo.variable} font-sans antialiased bg-[#ece5dd] text-[#075e54]`}>
        <BusinessConfigProvider>
          <ChatActionsProvider>
            {/* קונטיינר מרכזי שמבטיח שכל דף ירגיש כמו אפליקציה */}
            <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden md:max-w-none md:shadow-none">
              {children}
            </div>
            
            <Toaster />
            <ServiceWorkerRegistrar />
          </ChatActionsProvider>
        </BusinessConfigProvider>

        {/* מערכת צלצול התראות סבן */}
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
