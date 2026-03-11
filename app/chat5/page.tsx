"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

/**
 * קומפוננטות בטעינה דינמית לשיפור ביצועים ומניעת שגיאות SSR
 */

const ChatShell = dynamic(() => import("@/components/chat-shell"), { 
  ssr: true,
  fallback: <div className="min-h-screen bg-black" /> 
});

const AnimatedOrb = dynamic(() => import("@/components/animated-orb").then(m => m.AnimatedOrb || m.default), { 
  ssr: false 
});

const MessageList = dynamic(() => import("@/components/message-list").then(m => m.MessageList || m.default), { 
  ssr: false 
});

const Composer = dynamic(() => import("@/components/Composer").then(m => m.Composer || m.default), { 
  ssr: false 
});

const ProductCard = dynamic(() => import("@/components/ProductCard").then(m => m.ProductCard || m.default), { 
  ssr: false 
});

const CalculatorOverlay = dynamic(() => import("@/components/CalculatorOverlay").then(m => m.CalculatorOverlay || m.default), { 
  ssr: false 
});

const ActionOverlays = dynamic(() => import("@/components/ActionOverlays").then(m => m.ActionOverlays || m.default), { 
  ssr: false 
});

export default function ChatPage() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden text-white">
      {/* שכבת רקע ואנימציה */}
      <div className="fixed inset-0 z-0">
        <AnimatedOrb />
      </div>

      {/* מעטפת הצ'אט הראשית */}
      <div className="relative z-10 flex flex-col h-screen">
        <ChatShell>
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            <Suspense fallback={<div className="flex justify-center p-4">טוען הודעות...</div>}>
              <MessageList />
            </Suspense>
          </div>

          <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
            <Composer />
          </div>
        </ChatShell>
      </div>

      {/* שכבות אינטראקטיביות (Overlays) */}
      <aside className="relative z-20">
        <CalculatorOverlay />
        <ActionOverlays />
      </aside>

      {/* עיצוב גלובלי פשוט ל-Scrollbar במידת הצורך */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
