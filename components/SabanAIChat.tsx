"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bot, Send, X, MessageSquare, Sparkles, 
  Loader2, Menu, Truck, ArrowLeftRight 
} from "lucide-react";
import { toast } from "sonner";

export default function SabanAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, type?: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. שליפת ספר החוקים העדכני
      const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
      const rulesText = rules?.map(r => r.rule_description).join("\n") || "";

      // 2. ניתוח הבקשה ע"י המוח (כאן מחוברת לוגיקת ה-AI)
      // לצורך ההדגמה, נבצע לוגיקה חכמה שמזהה פקודות:
      setTimeout(async () => {
        let responseContent = "";
        let actionType = "chat";

        if (userMessage.includes("הזמנה") || userMessage.includes("הובלה")) {
          responseContent = "אח שלי, מנתח את הבקשה להזמנה... לפי ספר החוקים אני פותח הזמנה חדשה בסידור ומשייך לעלי.";
          actionType = "order";
          // ביצוע פעולה ב-DB
          await supabase.from('saban_orders').insert([{
            customer_name: "ממתין לזיהוי",
            delivery_time: "08:00",
            status: 'pending_ai'
          }]);
        } else if (userMessage.includes("העברה")) {
          responseContent = "הבנתי, מבצע העברה בין סניפים. מעדכן את חכמת שצריך לאסוף מהחרש.";
          actionType = "transfer";
        } else {
          responseContent = "שלום! אני מנהל הסידור של SabanOS. איך אני יכול לעזור בשיבוץ או במלאי היום?";
        }

        setMessages(prev => [...prev, { role: 'ai', content: responseContent, type: actionType }]);
        setIsTyping(false);
        (window as any).playNotificationSound?.();
      }, 1500);

    } catch (error) {
      toast.error("משהו השתבש במוח של הסדרן...");
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* כפתור המבורגר צף */}
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-50 transition-all transform hover:scale-110 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#0B2C63]'}`}
      >
        {isOpen ? <X size={30} /> : <Bot size={30} />}
      </Button>

      {/* חלון הצ'אט */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[380px] h-[550px] bg-white shadow-2xl rounded-[2rem] border-none flex flex-col z-50 animate-in slide-in-from-bottom-10 overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="bg-[#0B2C63] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles size={20} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-black text-lg leading-none">AI סידור</h3>
                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">SabanOS Operations</span>
              </div>
            </div>
            <Badge className="bg-green-500 text-[10px]">מחובר ל-DB</Badge>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <Bot size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm font-bold italic">אהלן! אני מנהל הסידור החכם.<br/>מה לבצע עכשיו?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-white text-slate-800 rounded-tr-none' 
                  : 'bg-blue-600 text-white rounded-tl-none'
                }`}>
                  {msg.type === 'order' && <Truck size={14} className="mb-1 text-blue-200" />}
                  {msg.type === 'transfer' && <ArrowLeftRight size={14} className="mb-1 text-blue-200" />}
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-end">
                <div className="bg-blue-100 p-3 rounded-2xl rounded-tl-none">
                  <Loader2 size={18} className="animate-spin text-blue-600" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="כתוב הודעה לסידור..."
              className="flex-1 h-12 rounded-xl border-none bg-slate-100 font-bold focus:ring-2 ring-blue-500"
            />
            <Button onClick={handleSendMessage} className="h-12 w-12 bg-[#0B2C63] rounded-xl p-0 shadow-lg">
              <Send size={20} />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
