"use client";

import { ChatShell } from "./components/chat-shell"; // שים לב אם זה chat-shell או ChatShell
import { AnimatedOrb } from "./components/animated-orb"; 
import { Composer } from "./components/Composer";
import { MessageList } from "./components/message-list";
import { ProductCard } from "./components/ProductCard";
import { CalculatorOverlay } from "./components/CalculatorOverlay";
import { ActionOverlays } from "./components/ActionOverlays";

export default function SabanAICanvas() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  
  // פונקציית צלצול (Notification Sound)
  const playNotification = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleSend = async (content: string) => {
    const userMsg = { id: Date.now(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [...messages, userMsg], userId: "rami_admin" })
      });
      const data = await res.json();

      if (data.shouldNotify) playNotification();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.text,
        product: data.product
      }]);

      // אם יש צורך בחישוב, נפתח מחשבון אוטומטית
      if (data.text.includes("חישוב") || data.text.includes("מ\"ר")) {
        setShowCalc(true);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatShell className="bg-[#020617] text-white selection:bg-blue-500/30">
      {/* ה-Orb של סבן - המוח הפועם ברקע */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-50">
        <AnimatedOrb />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-6xl mx-auto overflow-hidden">
        
        {/* Header פרימיום */}
        <header className="p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black italic text-xl">S</span>
            </div>
            <div>
              <h1 className="font-black italic text-lg tracking-tighter uppercase leading-none">SabanOS</h1>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Admin DNA Active</span>
            </div>
          </div>
          <ActionOverlays onCalcToggle={() => setShowCalc(!showCalc)} />
        </header>

        {/* מרכז הקנבס - הודעות וכרטיסי מוצר */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-black mb-4 tracking-tighter">שלום רמי, במה נתקדם?</h2>
              <p className="text-slate-400 max-w-xs text-sm">המוח מחובר למלאי, לחוקי הניהול ולמחשבון הכמויות.</p>
            </motion.div>
          )}
          
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <MessageList messages={[m]} />
                {m.product && (
                  <div className="flex justify-center py-4">
                    <ProductCard product={m.product} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && <div className="text-xs font-bold text-blue-400 animate-pulse px-4">סבן AI מעבד נתונים...</div>}
        </div>

        {/* שורת פקודה - Composer */}
        <footer className="p-6 pt-0">
          <div className="max-w-3xl mx-auto">
            <Composer onSend={handleSend} disabled={isLoading} />
          </div>
        </footer>
      </div>

      {/* שכבות צפות */}
      {showCalc && (
        <CalculatorOverlay onClose={() => setShowCalc(false)} />
      )}
    </ChatShell>
  );
}
