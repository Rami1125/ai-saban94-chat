"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, User, Bot, CheckCheck, Clock, 
  MoreVertical, Phone, Video, Search, Smile, Paperclip, 
  Truck, ArrowLeftRight, BellRing, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function SabanWhatsAppChat() {
  const [messages, setMessages] = useState<{id: string, role: 'user' | 'ai', text: string, time: string, status: string}[]>([]);
  const [input, setInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // גלילה אוטומטית לסוף
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  // טעינת ספר החוקים וזיהוי פקודות
  const handleSend = async () => {
    if (!input.trim()) return;

    const currentTime = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const newUserMsg = { id: Date.now().toString(), role: 'user' as const, text: input, time: currentTime, status: 'sent' };
    
    setMessages(prev => [...prev, newUserMsg]);
    const userText = input;
    setInput("");
    setIsAiThinking(true);

    try {
      // שליפת ספר החוקים מה-DB
      const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
      const rulesContext = rules?.map(r => r.rule_description).join("\n") || "פעל לפי היגיון לוגיסטי.";

      // סימולציה של מענה לפי ספר החוקים (בשלב הבא נחבר ל-Gemini API)
      setTimeout(async () => {
        let aiResponse = "";
        
        if (userText.includes("דחוף")) {
          aiResponse = "קיבלתי אחי. לפי ספר החוקים, הזמנות דחופות נכנסות לראש התור של עלי. פותח הזמנה ומעדכן את הסידור. 🏗️";
          // פתיחת הזמנה ב-DB
          await supabase.from('saban_orders').insert([{ customer_name: "דחוף - מהצאט", status: 'urgent' }]);
        } else if (userText.includes("העברה")) {
          aiResponse = "בודק מלאי בין 'התלמיד' ל'החרש'... יש אישור להעברה. מעדכן את חכמת לאיסוף. ✅";
        } else {
          aiResponse = "אהלן, כאן סידור ח.סבן (AI). ההודעה התקבלה, בודק איך זה מסתדר לנו בלוח השעות. מה מספר המסמך?";
        }

        const newAiMsg = { id: (Date.now()+1).toString(), role: 'ai' as const, text: aiResponse, time: currentTime, status: 'read' };
        setMessages(prev => [...prev, newAiMsg]);
        setIsAiThinking(false);
        (window as any).playNotificationSound?.();
      }, 1500);

    } catch (e) {
      setIsAiThinking(false);
      toast.error("תקלה בחיבור לסידור");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] font-sans border-r shadow-2xl overflow-hidden max-w-lg mx-auto border-l" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* WhatsApp Header */}
      <div className="bg-[#075E54] p-4 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
               <Bot size={24} className="text-white" />
             </div>
             <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#075E54]"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none flex items-center gap-2">
                סידור ח.סבן - מוח AI <Badge className="bg-blue-400 text-[8px] h-4">24/7</Badge>
            </h3>
            <p className="text-[10px] text-white/70">מחובר לספר החוקים • מחובר ל-DB</p>
          </div>
        </div>
        <div className="flex gap-4 opacity-80">
          <Video size={20} /><Phone size={18} /><MoreVertical size={20} />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        <div className="flex justify-center mb-4">
           <span className="bg-[#D1E9F6] text-[#4A5E75] text-[10px] px-3 py-1 rounded-lg shadow-sm font-bold uppercase tracking-wider">
             הודעות מוצפנות ופועלות לפי ספר החוקים
           </span>
        </div>

        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`relative max-w-[85%] p-2 rounded-xl shadow-sm ${
              msg.role === 'user' 
              ? 'bg-white text-slate-800 rounded-tr-none' 
              : 'bg-[#DCF8C6] text-slate-800 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium ml-8 pb-3">{msg.text}</p>
              <div className="absolute bottom-1 left-2 flex items-center gap-1">
                <span className="text-[9px] text-slate-400 font-bold">{msg.time}</span>
                {msg.role === 'ai' && <CheckCheck size={12} className="text-blue-500" />}
              </div>
            </div>
          </motion.div>
        ))}

        {isAiThinking && (
          <div className="flex justify-end animate-pulse">
            <div className="bg-[#DCF8C6] p-3 rounded-xl rounded-tl-none flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500">הסדרן מקליד...</span>
               <div className="flex gap-1">
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* WhatsApp Input Bar */}
      <div className="bg-[#F0F0F0] p-3 flex items-center gap-2">
        <div className="flex gap-3 text-slate-500 px-2">
           <Smile size={24} />
           <Paperclip size={24} />
        </div>
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="הקלד הודעה לסידור..."
          className="flex-1 h-10 rounded-full border-none shadow-sm font-bold text-sm px-4 focus-visible:ring-0"
        />
        <Button 
          onClick={handleSend}
          className="w-12 h-12 rounded-full bg-[#128C7E] hover:bg-[#075E54] p-0 shadow-lg flex items-center justify-center shrink-0 transition-transform active:scale-90"
        >
          <Send size={20} className="text-white transform rotate-180" />
        </Button>
      </div>
    </div>
  );
}
