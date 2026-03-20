"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Send, Sparkles, Brain, Zap, Clock, ShieldCheck, 
  Terminal, MessageSquare, RefreshCw, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function SabanSuperBrainCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [stats, setStats] = useState({ orders: 0, pending: 0, health: '100%' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  // טעינה ראשונית וחיבור ל-Realtime של Supabase
  useEffect(() => {
    loadInitialData();
    
    // האזנה לשינויים בטבלת החוקים ובטבלת הבקשות
    const rulesChannel = supabase.channel('rules_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_brain_rules' }, () => {
        loadInitialData();
        toast.info("חוקי המוח עודכנו ב-DB");
      })
      .subscribe();

    const requestsChannel = supabase.channel('brain_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, () => loadInitialData())
      .subscribe();

    return () => { 
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  // גלילה אוטומטית כשיש הודעה חדשה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const loadInitialData = async () => {
    try {
      // משיכת חוקים פעילים
      const { data: rulesData } = await supabase
        .from('saban_brain_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // משיכת סטטיסטיקות מהשטח
      const { data: reqs } = await supabase.from('saban_requests').select('id, status');
      
      setRules(rulesData || []);
      setStats({
        orders: reqs?.length || 0,
        pending: reqs?.filter(r => r.status === 'pending').length || 0,
        health: '99.2%'
      });
    } catch (error) {
      console.error("Error loading brain data:", error);
    }
  };

  const handleCommand = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // קריאה למנוע ה-AI של סבן
      const response = await SabanBrain.ask(userMsg);
      
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      
      // הפעלת סאונד הצלחה (מתוך ה-Layout הראשי)
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
    } catch (e) {
      toast.error("שגיאה בעיבוד הנתונים במוח");
      setMessages(prev => [...prev, { role: 'ai', content: "מצטער ראמי, יש לי נתק זמני בסינפסות. נסה שוב." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-left" richColors />
      
      {/* Top Navbar */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight italic text-white uppercase">SABAN <span className="text-blue-500">SuperBrain</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operational System v4.0</span>
            </div>
          </div>
        </div>
        <Button variant="outline" className="border-white/10 bg-white/5 rounded-xl gap-2 font-bold hover:bg-white/10 text-xs" onClick={loadInitialData}>
          <RefreshCw size={14} /> סנכרן נתונים
        </Button>
      </nav>

      <div className="flex-1 max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Sidebar - Rules */}
        <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
            <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] backdrop-blur-xl border-t-blue-500/30 border-t-2">
                <h3 className="text-xs font-black text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldCheck size={16}/> ספר חוקים פעיל
                </h3>
                <div className="space-y-6">
                    {rules.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center">אין חוקים פעילים בטבלה</p>
                    ) : rules.map((r, i) => (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          key={i} 
                          className="group cursor-default border-r-2 border-transparent hover:border-blue-500 pr-3 transition-all"
                        >
                            <div className="text-[11px] font-black text-white/90 mb-1">{r.rule_name}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                              {r.rule_description}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-white/10 p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-blue-200 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16}/> נתוני שטח (Live)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                        <div className="text-2xl font-black">{stats.orders}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">סה"כ בקשות</div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                        <div className="text-2xl font-black text-orange-400">{stats.pending}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ממתין לסידור</div>
                    </div>
                </div>
            </Card>
        </aside>

        {/* Center - Terminal */}
        <main className="col-span-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 shadow-inner">
                   <div className="flex items-center gap-3">
                      <Terminal size={18} className="text-blue-500" />
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Saban_OS_Terminal_v4.0.1</span>
                   </div>
                   <Badge className="bg-blue-500/20 text-blue-400 border-none px-3 py-1 text-[9px] font-black">AI_CORE_READY</Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <Sparkles size={64} className="mb-4 text-blue-500 animate-pulse" />
                            <p className="font-black text-2xl tracking-tighter uppercase">המערכת מוכנה לפקודה</p>
                            <p className="text-sm mt-2 font-medium italic">"ראמי, מה הסטטוס בנתיבי איילון?"</p>
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, scale: 0.95 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[15px] font-bold shadow-2xl leading-relaxed ${
                                    m.role === 'user' ? 'bg-white/5 border border-white/10 text-slate-300 rounded-tr-none' : 'bg-blue-600 text-white shadow-blue-900/40 rounded-tl-none'
                                }`}>
                                    <div className={`flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-widest opacity-60 ${m.role === 'user' ? 'text-blue-400' : 'text-blue-100'}`}>
                                        {m.role === 'user' ? <ShieldCheck size={12}/> : <Zap size={12}/>}
                                        {m.role === 'user' ? 'ADMIN_SABAN' : 'SABAN_BRAIN_AI'}
                                    </div>
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end px-4">
                            <div className="bg-blue-600/20 px-6 py-3 rounded-full text-[10px] font-black uppercase text-blue-300 flex items-center gap-3">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                              מעבד נתונים לוגיסטיים...
                            </div>
                        </motion.div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-8 bg-black/40 border-t border-white/5">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                            placeholder="הקלד פקודה לסידור..."
                            className="h-16 rounded-[1.5rem] bg-white/5 border-white/10 text-white font-bold text-lg px-8 focus:ring-2 ring-blue-600 focus:bg-white/10 transition-all placeholder:text-slate-600"
                        />
                        <Button onClick={handleCommand} disabled={isTyping} className="h-16 w-16 bg-blue-600 hover:bg-blue-500 rounded-[1.5rem] shrink-0 shadow-lg shadow-blue-500/20 transition-all active:scale-90">
                            <Send size={24} />
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        {/* Right Sidebar - Status */}
        <aside className="col-span-3 flex flex-col gap-6">
            <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] border-r-blue-500/30 border-r-2">
                <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> ביצועי מערכת</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Uptime מודלים</span>
                        <span className="text-xl font-black text-green-400">{stats.health}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">מפתחות ב-Pool</span>
                        <Badge className="bg-blue-600 text-[10px] font-black px-3">ACTIVE</Badge>
                    </div>
                    <div className="pt-2">
                        <div className="text-[10px] font-bold text-slate-600 uppercase mb-2">עומס מעבד AI</div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '24%' }} 
                            className="bg-blue-500 h-full"
                           />
                        </div>
                    </div>
                </div>
            </Card>
        </aside>
      </div>
    </div>
  );
}
