// components/ClientProviders.tsx
"use client";
import { ChatActionsProvider } from "@/context/ChatActionsContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import Script from "next/script";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <BusinessConfigProvider>
      <ChatActionsProvider>
        {/* מגן IndexedDB ו-OneSignal */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          try {
            if (!window.indexedDB) {
              window.isIndexedDBAvailable = false;
              console.warn("IndexedDB not available.");
            } else {
              window.isIndexedDBAvailable = true;
            }
          } catch (e) { window.isIndexedDBAvailable = false; }
        `}} />
        
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred.push(async function(OneSignal) {
              if (window.isIndexedDBAvailable === false) return;
              try {
                await OneSignal.init({
                  appId: "acc8a2bc-d54e-4261-b3d2-cc5c5f7b39d3",
                  safari_web_id: "web.onesignal.auto.5f4f9ed9-fb2e-4d6a-935d-81aa46fccce0",
                  notifyButton: { enable: true },
                  allowLocalhostAsSecureOrigin: true
                });
              } catch (err) {}
            });
          `}
        </Script>

        {children}
        <Toaster />
        <ServiceWorkerRegistrar />

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
      </ChatActionsProvider>
    </BusinessConfigProvider>
  );
}
