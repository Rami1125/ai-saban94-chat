"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

/**
 * קומפוננטות בטעינה דינמית (Client-side only)
 * שימוש בנתיבים יחסיים להבטחת תאימות מלאה ל-Turbopack ב-Vercel
 */

const ChatShell = dynamic(() => import("../../components/chat-shell"), { 
  ssr: true,
  fallback: <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">טוען ממשק...</div> 
});

const AnimatedOrb = dynamic(() => import("../../components/animated-orb").then(m => m.AnimatedOrb || m.default), { 
  ssr: false 
});

const MessageList = dynamic(() => import("../../components/message-list").then(m => m.MessageList || m.default), { 
  ssr: false 
});

const Composer = dynamic(() => import("../../components/Composer").then(m => m.Composer || m.default), { 
  ssr: false 
});

const ProductCard = dynamic(() => import("../../components/ProductCard").then(m => m.ProductCard || m.default), { 
  ssr: false 
});

const CalculatorOverlay = dynamic(() => import("../../components/CalculatorOverlay").then(m => m.CalculatorOverlay || m.default), { 
  ssr: false 
});

const ActionOverlays = dynamic(() => import("../../components/ActionOverlays").then(m => m.ActionOverlays || m.default), { 
  ssr: false 
});

export default function ChatPage() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden text-white font-sans antialiased">
      
      {/* 1. שכבת רקע - האורב הדינמי */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedOrb />
      </div>

      {/* 2. מבנה הצא'ט הראשי */}
      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto shadow-2xl">
        <ChatShell>
          {/* אזור ההודעות */}
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
            <Suspense fallback={<div className="flex justify-center p-8 text-zinc-400">מתחבר למוח של סבן...</div>}>
              <div className="space-y-6">
                <MessageList />
                {/* ProductCard נטען כאן בתוך זרם ההודעות במידת הצורך */}
              </div>
            </Suspense>
          </div>

          {/* אזור הזנת טקסט (Composer) */}
          <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/5">
            <Composer />
          </div>
        </ChatShell>
      </div>

      {/* 3. כלי עזר צפים (Overlays) */}
      <div className="relative z-50">
        <Suspense fallback={null}>
          <CalculatorOverlay />
          <ActionOverlays />
        </Suspense>
      </div>

      {/* עיצוב גלובלי ל-Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </main>
  );
}
