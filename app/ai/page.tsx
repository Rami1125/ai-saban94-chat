"use client";
import React, { useState, useEffect } from 'react';
import { Brain, Send, Loader2, Sparkles, Terminal, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export default function SabanAiPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      
      setReport(data);
      if (data.aiResponse) {
        setMessages(prev => [...prev, { role: 'ai', content: data.aiResponse }]);
        if (data.executionResult?.includes('✅')) {
          toast.success("פעולת SQL בוצעה בהצלחה! 🦾");
        }
      }
    } catch (e) {
      toast.error("שגיאה בתקשורת עם המוח");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center py-6 border-b border-white/10">
          <div className="text-left">
            <h1 className="text-2xl font-black italic text-blue-400 flex items-center gap-2">
              SABAN AI BRAIN <Brain size={24} />
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advanced Neural Dispatch</p>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-[2.5rem] p-6 h-[500px] flex flex-col shadow-2xl">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 no-scrollbar p-2">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 italic space-y-2 opacity-50">
                <Sparkles size={48} />
                <p>ממתין לפקודה שלך, ראמי אחי...</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] font-bold text-sm ${
                  m.role === 'user' ? 'bg-white/5 text-slate-300' : 'bg-blue-600 text-white border-r-4 border-blue-400'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && <Loader2 className="animate-spin text-blue-400 mx-auto" />}
          </div>

          <div className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="כתוב פקודה (למשל: תעביר את אדר בניה לשעה 11:00)"
              className="flex-1 bg-transparent border-none outline-none px-4 font-bold text-white text-right"
            />
            <Button onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 rounded-xl w-14 h-14 p-0 border-none cursor-pointer">
              <Send size={20} />
            </Button>
          </div>
        </Card>

        {/* System Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Card className="bg-slate-900 border-slate-800 p-4 rounded-2xl flex items-center gap-4">
              <Terminal size={20} className="text-green-400" />
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase">DB Status</p>
                <p className="font-black text-xs text-green-400">{report?.dbStatus || "ONLINE ✅"}</p>
              </div>
           </Card>
           <Card className="md:col-span-2 bg-slate-900 border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase">Last SQL Execution</p>
                <p className="font-bold text-xs text-blue-300 italic">{report?.executionResult || "> Awaiting signal..."}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase">Latency</p>
                <p className="font-bold text-xs text-slate-400">{report?.latency || "0ms"}</p>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
