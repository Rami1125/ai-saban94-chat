"use client";

import dynamic from "next/dynamic";

// רכיבים דינמיים למניעת שגיאות SSR ו-Hydration
const ChatShell = dynamic(() => import("@/components/ChatShell"), { 
  ssr: true,
  loading: () => <div className="h-screen w-full bg-black" /> 
});

const MessageList = dynamic(() => import("@/components/chat/MessageList"), { ssr: false });
const Composer = dynamic(() => import("@/components/chat/Composer"), { ssr: false });
const ActionOverlays = dynamic(() => import("@/components/chat/ActionOverlays"), { ssr: false });

// קבצים כלליים - שים לב לאותיות גדולות בתחילת שם הקובץ
const AnimatedOrb = dynamic(() => import("@/components/AnimatedOrb"), { ssr: false });
const ProductCard = dynamic(() => import("@/components/ProductCard"), { ssr: false });
const CalculatorOverlay = dynamic(() => import("@/components/CalculatorOverlay"), { ssr: false });

export default function ChatPage() {
  return (
    <ChatShell>
      <AnimatedOrb />
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MessageList />
        </div>

        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Composer />
        </div>
      </div>

      <ActionOverlays />
      <CalculatorOverlay />
      
      <div className="hidden">
        <ProductCard />
      </div>
    </ChatShell>
  );
}
