"use client";
import React, { useState, useRef } from 'react';
import { 
  Send, Menu, X, PlusCircle, RefreshCcw, UserPlus, 
  Settings, MessageSquare, Terminal, Copy, Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";

export default function SabanBrainControl() {
  const [input, setInput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // רשימת הפקודות המהירות להזרקה
  const quickCommands = [
    { 
        label: "הזמנה חדשה", 
        cmd: "[CREATE_ORDER:לקוח|הצבה|מחסן|שעה|קומקס]", 
        icon: <PlusCircle size={18}/>,
        desc: "פתיחת הצבה/חומר חדש"
    },
    { 
        label: "עדכון סטטוס", 
        cmd: "[UPDATE_STATUS:קומקס|בביצוע]", 
        icon: <RefreshCcw size={18}/>,
        desc: "שינוי שלב (פתוח/ביצוע/הושלם)"
    },
    { 
        label: "החלפת נהג", 
        cmd: "[REASSIGN_DRIVER:קומקס|שם_נהג]", 
        icon: <UserPlus size={18}/>,
        desc: "העברת משימה לנהג אחר"
    },
    { 
        label: "עדכון פרטים", 
        cmd: "[UPDATE_ORDER:קומקס|שדה|ערך]", 
        icon: <Settings size={18}/>,
        desc: "שינוי שעה, כתובת או הערה"
    }
  ];

  const injectCommand = (cmd: string) => {
    setInput(cmd);
    setIsMenuOpen(false);
    toast.success("הפקודה הוזרקה! עדכן פרמטרים ושלח.");
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg, history: history.slice(-5) })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { role: 'assistant', text: data.aiResponse }]);
    } catch (err) {
      toast.error("שגיאת תקשורת עם המוח");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans flex overflow-hidden" dir="rtl">
      <Toaster position="top-left" richColors />

      {/* תפריט המבורגר צדדי (Sidebar) */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black italic text-blue-700 uppercase tracking-tighter">ח. סבן</h2>
            <button className="lg:hidden" onClick={() => setIsMenuOpen(false)}><X/></button>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">פקודות מהירות (Inject)</p>
          <div className="space-y-3">
            {quickCommands.map((item) => (
              <button 
                key={item.label}
                onClick={() => injectCommand(item.cmd)}
                className="w-full flex flex-col gap-1 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-all text-right border border-transparent hover:border-blue-100 group"
              >
                <div className="flex items-center gap-2 font-black text-sm">
                    {item.icon}
                    {item.label}
                </div>
                <p className="text-[10px] text-slate-400 font-bold group-hover:text-blue-400">{item.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 bg-blue-600 rounded-2xl text-white">
            <p className="text-xs font-black italic">SabanOS v2.0</p>
            <p className="text-[9px] opacity-70">Brain Connected & Online</p>
          </div>
        </div>
      </aside>

      {/* מרכז הצאט (Main View) */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Header נייד */}
        <header className="lg:hidden p-4 bg-white shadow-sm flex items-center justify-between">
            <h1 className="font-black italic text-blue-700">ח. סבן AI</h1>
            <button onClick={() => setIsMenuOpen(true)}><Menu/></button>
        </header>

        {/* הודעות צאט */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <Terminal size={64} className="opacity-20"/>
                <p className="font-black italic uppercase tracking-widest">ממתין לפקודה שלך, ראמי אחי...</p>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[80%] p-4 rounded-[1.5rem] shadow-sm border-none ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}>
                <p className="text-sm font-bold whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-white p-4 rounded-full shadow-sm animate-pulse flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
          )}
        </div>

        {/* תיבת קלט תחתונה */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F1F5F9] via-[#F1F5F9] to-transparent">
          <Card className="max-w-4xl mx-auto bg-white rounded-[2rem] p-3 shadow-2xl border-none ring-1 ring-black/5 flex items-center gap-3">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <MessageSquare size={20}/>
             </div>
             <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="כתוב פקודה או הזרק מהתפריט..."
                className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300 text-right"
             />
             <button 
                onClick={handleSendMessage}
                disabled={loading}
                className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
             >
                <Send size={20}/>
             </button>
          </Card>
        </div>
      </main>
    </div>
  );
}
