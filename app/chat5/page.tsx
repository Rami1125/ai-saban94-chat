"use client";

// קבצים בתוך תיקיית chat
const MessageList = dynamic(() => import("@/components/chat/message-list"), { ssr: false });
const Composer = dynamic(() => import("@/components/chat/composer"), { ssr: false });
const ActionOverlays = dynamic(() => import("@/components/chat/action-overlays"), { ssr: false });

// קבצים בתיקיית components הראשית (שים לב לאותיות קטנות/גדולות)
const ChatShell = dynamic(() => import("@/components/chat-shell"), { ssr: true });
const AnimatedOrb = dynamic(() => import("@/components/animated-orb"), { ssr: false });
const ProductCard = dynamic(() => import("@/components/product-card"), { ssr: false });
const CalculatorOverlay = dynamic(() => import("@/components/calculator-overlay"), { ssr: false });

export default function ChatPage() {
  return (
    <main className="relative min-h-screen w-full bg-black overflow-hidden text-white font-sans antialiased">
      
      {/* שכבת רקע - האורב הדינמי */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedOrb />
      </div>

      {/* מבנה הצא'ט הראשי */}
      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto shadow-2xl">
        <ChatShell>
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth">
            <Suspense fallback={<div className="flex justify-center p-8 text-zinc-400">מתחבר למערכת סבן...</div>}>
              <div className="space-y-6">
                <MessageList />
              </div>
            </Suspense>
          </div>

          <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/5">
            <Composer />
          </div>
        </ChatShell>
      </div>

      {/* כלי עזר צפים - Overlays */}
      <div className="relative z-50">
        <Suspense fallback={null}>
          <CalculatorOverlay />
          <ActionOverlays />
        </Suspense>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
}
