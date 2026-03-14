"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Bot, Send, User, Zap, MapPin, 
  Package, Link as LinkIcon, Image as ImageIcon, 
  Info, Sparkles, MessageSquare, ExternalLink 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

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
      <a 
        key={match[2]} 
        href={match[2]} 
        target="_blank" 
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md my-1"
      >
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('saban_studio_history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('saban_studio_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // סרגל כלים - הזרקת תחבירים
  const injectTool = (type: string) => {
    const tools: Record<string, string> = {
      location: "איפה הסניפים שלכם?",
      product: "תציג לי כרטיס מוצר של סיקה 107 עם תמונה",
      magic: "איך נראה לינק קסם מאחורי כפתור?",
    };
    setInput(tools[type]);
    toast.success("הפקודה נטענה לסרגל");
  };
// --- תיקון פונקציית askGemini בקובץ admin3/page.tsx ---

const askGemini = async () => {
  if (!input.trim()) return;
  const userMsg = input;
  setInput("");
  setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
  setIsTyping(true);

  // שימוש ב-Backticks (`) פותר את שגיאת ה-Parsing ב-Build
  setTimeout(() => {
    let aiContent = "";
    if (userMsg.includes("איפה") || userMsg.includes("סניף")) {
      aiContent = `### 📍 ניווט לסניפי חמ"ל סבן

* 🏗️ **סניף החרש 10, הוד השרון:** למשלוחי מנוף.
* 🏫 **סניף התלמיד 6,הוד השרון:** לאיסוף ידני.

[לניווט ב-Waze ופרטי התקשרות לחץ כאן 📍](https://ai-saban94-chat.vercel.app/branches)`;
    } else if (userMsg.includes("סיקה") || userMsg.includes("מוצר")) {
      aiContent = `מצאתי עבורך **סיקה 107** במלאי!

https://gilar.co.il/wp-content/uploads/2016/07/GLR_SikaTop-Seal-107-Whitek-400x400.png

[לרכישה מהירה בלינק קסם ⚡](https://saban.co.il/p/sika107)`;
    } else {
      aiContent = `ראמי אחי, הנה דוגמה לעיצוב UI בזמן אמת:

[כפתור מעוצב עם לינק מוסתר 🦾](https://ai-saban94-chat.vercel.app)`;
    }
    
    setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    setIsTyping(false);
  }, 1000);
};
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg animate-pulse">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-black italic text-slate-800 tracking-tighter text-xl">SABAN STUDIO UI</h1>
        </div>
        <Button variant="ghost" onClick={() => setShowGuide(!showGuide)} className="rounded-full gap-2 font-bold text-blue-600">
          <Info size={18} /> מדריך עיצוב
        </Button>
      </header>

      {/* מדריך הדרכה צף */}
      <AnimatePresence>
        {showGuide && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-blue-50 border-b overflow-hidden">
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black mb-1 text-blue-700">🔗 לינק מאחורי כפתור</p>
                <code>[טקסט הכפתור](URL)</code>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black mb-1 text-blue-700">🖼️ הצגת תמונה</p>
                <p>פשוט הדבק לינק ישיר לתמונה בטקסט.</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-black mb-1 text-blue-700">💡 טיפ עיצוב</p>
                <p>השתמש ב-### לכותרות בולטות וב-* לבולטים.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-white text-slate-800 border' : 'bg-blue-50 text-slate-900 border-blue-100'}`}>
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase opacity-50">
                {m.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                {m.role === 'user' ? 'ראמי' : 'המוח המעצב'}
              </div>
              <MarkdownButton text={m.content} />
              <SmartMedia content={m.content} />
            </div>
          </motion.div>
        ))}
        {isTyping && <div className="text-xs font-black text-blue-600 animate-pulse italic">המוח מעבד UI... 🦾</div>}
        <div ref={scrollRef} />
      </div>

      {/* Toolbar & Input */}
      <div className="p-4 bg-white border-t space-y-4 pb-8">
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => injectTool('location')} className="rounded-xl gap-2 font-bold bg-slate-50"><MapPin size={14}/> סניפים</Button>
          <Button variant="outline" size="sm" onClick={() => injectTool('product')} className="rounded-xl gap-2 font-bold bg-slate-50"><Package size={14}/> מוצר</Button>
          <Button variant="outline" size="sm" onClick={() => injectTool('magic')} className="rounded-xl gap-2 font-bold bg-slate-50"><Sparkles size={14}/> לינק קסם</Button>
        </div>
        
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askGemini()}
            placeholder="כתוב הודעה או בחר כלי מהסרגל..."
            className="h-14 rounded-2xl border-slate-200 shadow-inner font-bold"
          />
          <Button onClick={askGemini} className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shrink-0">
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
