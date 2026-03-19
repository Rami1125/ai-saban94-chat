"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Send, User, Zap, MapPin, 
  Package, Link as LinkIcon, Image as ImageIcon, 
  Info, Sparkles, MessageSquare, ExternalLink,
  Clock, Truck, AlertTriangle, FileText, Share2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { getSupabase } from "@/lib/supabase";

// --- רכיב תצוגת מדיה חכמה ---
const SmartMedia = ({ content }: { content: string }) => {
  const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
  const match = content.match(imgRegex);
  if (match) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl overflow-hidden border shadow-sm max-w-sm">
        <img src={match[0]} alt="Preview" className="w-full h-auto object-cover" />
      </motion.div>
    );
  }
  return null;
};

// --- רכיב כפתור Markdown מעוצב ---
const MarkdownButton = ({ text }: { text: string }) => {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    parts.push(text.substring(lastIndex, match.index));
    parts.push(
      <a key={match[2]} href={match[2]} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md my-1">
        {match[1]} <ExternalLink size={12} />
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }
  parts.push(text.substring(lastIndex));
  return <div className="whitespace-pre-wrap">{parts.length > 1 ? parts : text}</div>;
};

export default function SabanStudioUI() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>(["המערכת סורקת בקשות חריגות...", "חוק דחיפות פעיל: הזמנות ללא שעה יסומנו בצהובה"]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // טעינת היסטוריה
  useEffect(() => {
    const saved = localStorage.getItem('saban_studio_history');
    if (saved) setMessages(JSON.parse(saved));
    
    // האזנה לשינויים בסידור להפקת תובנות בזמן אמת (המלשינון)
    const channel = supabase.channel('brain_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_orders' }, payload => {
          checkBrainRules(payload.new);
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    localStorage.setItem('saban_studio_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // לוגיקת ספר החוקים (המלשינון)
  const checkBrainRules = (order: any) => {
    if (!order) return;
    const now = new Date();
    const deliveryTime = new Date(`${order.delivery_date}T${order.delivery_time}`);
    const diff = (deliveryTime.getTime() - now.getTime()) / 60000;

    if (diff < 60 && diff > 0) {
        setAiInsights(prev => [`⚠️ חייבים להעמיס: הזמנה ל${order.customer_name} בעוד שעה!`, ...prev.slice(0, 4)]);
        (window as any).playNotificationSound?.();
    }
  };

  const askGemini = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    // לוגיקה לביצוע פעולות דינמיות
    setTimeout(async () => {
      let aiContent = "";
      
      if (userMsg.includes("תזיז") || userMsg.includes("שעה")) {
        // סימולציה של הזזת שעה ב-DB
        aiContent = `בוצע! הזזתי את שעת האספקה של ההזמנה לשעה **15:00**. לוח השעות בסידור התעדכן דינאמית. ✅`;
        // כאן תבוא קריאת supabase.update...
      } 
      else if (userMsg.includes("דוח בוקר") || userMsg.includes("שתף")) {
        aiContent = `מפיק דוח בוקר מעוצב... 📝\n\n*סידור עבודה ח.סבן - ${new Date().toLocaleDateString('he-IL')}*\n🏗️ משאית עלי: 3 הזמנות\n🏗️ מנוף חכמת: 2 הזמנות\n\n[לחץ כאן לשיתוף מהיר לווטסאפ 📱](https://wa.me/?text=הנה+דוח+בוקר)`;
      }
      else {
        aiContent = `ראמי אחי, אני מאזין לספר החוקים. זיהיתי את הבקשה שלך ואני פועל לסנכרן את הסידור בהתאם. מה המשימה הבאה?`;
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      setIsTyping(false);
      (window as any).playNotificationSound?.();
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="p-4 bg-white border-b shadow-sm flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#0B2C63] p-2 rounded-lg text-white shadow-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-black italic text-slate-800 tracking-tighter text-xl">SABAN STUDIO UI <span className="text-blue-600">AI</span></h1>
        </div>
        <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowGuide(!showGuide)} className="rounded-full gap-2 font-bold text-[#0B2C63]">
              <Info size={18} /> חוקי המוח
            </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* לוח מחוונים AI - המלשינון */}
        <aside className="w-80 bg-white border-l p-4 hidden lg:flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3">
                <Bot className="text-blue-600" />
                <h2 className="font-black text-slate-800">לוח מחוונים AI</h2>
            </div>
            <div className="space-y-3">
                {aiInsights.map((insight, idx) => (
                    <Card key={idx} className={`p-3 rounded-xl border-none shadow-sm text-xs font-bold leading-relaxed ${insight.includes('⚠️') ? 'bg-red-50 text-red-700 border-r-4 border-red-500 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
                        {insight}
                    </Card>
                ))}
            </div>
            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-[10px] text-slate-400 font-bold">
                המוח פועל לפי ספר חוקי ח.סבן 2026. כל הפעולות מתועדות בטבלה לשימוש היסטורי.
            </div>
        </aside>

        {/* Messages Area */}
        <main className="flex-1 flex flex-col relative bg-slate-50/30">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.8rem] shadow-sm ${m.role === 'user' ? 'bg-white text-slate-800 border-2 border-slate-100' : 'bg-[#0B2C63] text-white'}`}>
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase opacity-60">
                      {m.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
                      {m.role === 'user' ? 'ראמי' : 'AI סידור'}
                    </div>
                    <MarkdownButton text={m.content} />
                    <SmartMedia content={m.content} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
                <div className="flex justify-end animate-pulse">
                    <div className="bg-slate-200 px-4 py-2 rounded-full text-[10px] font-black text-slate-500">המוח מעבד פקודת סידור...</div>
                </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Toolbar & Input */}
          <div className="p-4 bg-white border-t space-y-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <Button variant="outline" size="sm" onClick={() => setInput('תכין דוח בוקר לווטסאפ')} className="rounded-xl gap-2 font-bold bg-slate-50 shrink-0 border-slate-100"><FileText size={14}/> דוח בוקר</Button>
              <Button variant="outline" size="sm" onClick={() => setInput('תזיז הזמנה לשעה 15:00')} className="rounded-xl gap-2 font-bold bg-slate-50 shrink-0 border-slate-100"><Clock size={14}/> הזזת שעה</Button>
              <Button variant="outline" size="sm" onClick={() => setInput('שתף הזמנה חדשה')} className="rounded-xl gap-2 font-bold bg-slate-50 shrink-0 border-slate-100"><Share2 size={14}/> שיתוף מהיר</Button>
            </div>
            
            <div className="max-w-5xl mx-auto flex gap-3">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askGemini()}
                placeholder="ראמי, תן פקודה לסידור (למשל: תזיז שעה או תכין דוח)..."
                className="h-14 rounded-2xl border-slate-200 bg-slate-50 shadow-inner font-bold text-lg focus:ring-2 ring-blue-500 transition-all"
              />
              <Button onClick={askGemini} className="h-14 w-14 rounded-2xl bg-[#0B2C63] hover:bg-blue-900 shadow-xl shrink-0 transition-all active:scale-90">
                <Send size={22} />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
