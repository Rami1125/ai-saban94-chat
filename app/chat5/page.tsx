"use client";

import dynamic from "next/dynamic";

// קבצים בתוך תיקיית components/chat
const ChatShell = dynamic(() => import("@/components/chat-shell"), { 
  ssr: true,
  loading: () => <div className="h-screen w-full bg-black" /> 
});

const MessageList = dynamic(() => import("@/components/chat/message-list"), { ssr: false });
const Composer = dynamic(() => import("@/components/chat/composer"), { ssr: false });
const ActionOverlays = dynamic(() => import("@/components/chat/action-overlays"), { ssr: false });

// קבצים כלליים בתיקיית components
const AnimatedOrb = dynamic(() => import("@/components/animated-orb"), { ssr: false });
const ProductCard = dynamic(() => import("@/components/product-card"), { ssr: false });
const CalculatorOverlay = dynamic(() => import("@/components/calculator-overlay"), { ssr: false });

export default function ChatPage() {
  return (
    <ChatShell>
      {/* הרקע המונפש */}
      <AnimatedOrb />
      
      <div className="flex flex-col h-full relative z-10">
        {/* רשימת ההודעות */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MessageList />
        </div>

        {/* אזור כתיבת ההודעה */}
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Composer />
        </div>
      </div>

      {/* שכבות עליונות (Overlays) */}
      <ActionOverlays />
      <CalculatorOverlay />
      
      {/* דוגמה לכרטיס מוצר אם נדרש בתצוגה ראשונית */}
      <div className="hidden">
        <ProductCard />
      </div>
    </ChatShell>
  );
}
