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
  Terminal, MessageSquare, RefreshCw, AlertCircle, LayoutDashboard, Database
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

  useEffect(() => {
    loadInitialData();
    // Realtime Sync
    const channel = supabase.channel('brain_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, () => loadInitialData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadInitialData = async () => {
    const { data: rulesData } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
    const { data: reqs } = await supabase.from('saban_requests').select('id, status');
    setRules(rulesData || []);
    setStats({
      orders: reqs?.length || 0,
      pending: reqs?.filter(r => r.status === 'pending').length || 0,
      health: '98.4%'
    });
  };

  const handleCommand = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);

    const response = await SabanBrain.ask(msg);
    
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsTyping(false);
    if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30" dir="rtl">
      <Toaster position="top-left" richColors />
      
      {/* Top Navbar */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight italic">SABAN <span className="text-blue-500 text-sm not-italic font-bold tracking-widest ml-1 uppercase">SuperBrain</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-left">Operational System v4.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-r border-white/10 pr-8 mr-2">
                <span className="hover:text-white cursor-pointer transition-colors">סידור</span>
                <span className="hover:text-white cursor-pointer transition-colors text-blue-400 border-b-2 border-blue-500">מרכז המוח</span>
                <span className="hover:text-white cursor-pointer transition-colors">דוחות</span>
            </div>
            <Button variant="outline" className="border-white/10 bg-white/5 rounded-xl gap-2 font-bold hover:bg-white/10">
                <RefreshCw size={16} /> סנכרן
            </Button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        
        {/* Left Sidebar - Rules & Knowledge */}
        <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                <h3 className="text-xs font-black text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-widest"><ShieldCheck size={16}/> ספר חוקים פעיל</h3>
                <div className="space-y-4">
                    {rules.map((r, i) => (
                        <div key={i} className="group cursor-default">
                            <div className="text-[11px] font-black text-white/90 mb-1">{r.rule_name}</div>
                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{r.rule_description}</div>
                        </div>
                    ))}
                    {rules.length === 0 && <p className="text-[10px] text-slate-600 italic">אין חוקים מוגדרים...</p>}
                </div>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-white/10 p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-blue-200 mb-4 uppercase tracking-widest flex items-center gap-2"><Database size={16}/> נתוני שטח</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black">{stats.orders}</div>
                        <div className="text-[9px] font-bold text-slate-400">סה"כ בקשות</div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black text-orange-400">{stats.pending}</div>
                        <div className="text-[9px] font-bold text-slate-400">ממתין לסידור</div>
                    </div>
                </div>
            </Card>
        </aside>

        {/* Center - Terminal/Chat */}
        <main className="col-span-6 flex flex-col gap-4">
            <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
                {/* AI Signature Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                    <Bot size={400} />
                </div>
                
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                   <div className="flex items-center gap-3">
                      <Terminal size={18} className="text-blue-500" />
                      <span className="font-mono text-xs font-bold text-slate-300">SYSTEM_CORE_LOG: ACTIVE</span>
                   </div>
                   <Badge className="bg-blue-500/20 text-blue-400 border-none px-3 py-1">REALTIME_SYNC</Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                            <Sparkles size={48} className="mb-4 text-blue-500" />
                            <p className="font-black text-xl tracking-tighter">המערכת מוכנה לפקודה</p>
                            <p className="text-sm mt-2 font-medium italic">"תכין לי דוח בוקר לווטסאפ של עלי"</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {messages.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-2xl leading-relaxed ${
                                    m.role === 'user' ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-blue-600 text-white shadow-blue-900/20'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2 text-[9px] font-black uppercase tracking-widest opacity-50">
                                        {m.role === 'user' ? 'USER_SABAN' : 'AI_INTERNAL'}
                                    </div>
                                    {m.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isTyping && (
                        <div className="flex justify-end animate-pulse">
                            <div className="bg-blue-600/30 px-6 py-3 rounded-full text-[10px] font-black uppercase text-blue-300">המוח ברוטציית מפתחות...</div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Command Input Area */}
                <div className="p-6 bg-black/40 border-t border-white/5">
                    <div className="max-w-3xl mx-auto flex gap-3 relative group">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                            placeholder="הקלד פקודה לסידור..."
                            className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-lg px-6 focus:ring-2 ring-blue-600 transition-all placeholder:text-white/10"
                        />
                        <Button onClick={handleCommand} className="h-16 w-16 bg-blue-600 hover:bg-blue-500 rounded-2xl shrink-0 shadow-lg shadow-blue-900/50 group-active:scale-95 transition-transform">
                            <Send size={24} />
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        {/* Right Sidebar - System Stats */}
        <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto">
            <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem]">
                <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><Zap size={16}/> ביצועים בזמן אמת</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-xs font-bold text-slate-500">תקינות מודלים</span>
                        <span className="text-xl font-black text-green-400">{stats.health}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-xs font-bold text-slate-500">עומס עבודה</span>
                        <span className="text-xl font-black text-blue-400">נמוך</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-xs font-bold text-slate-500">רוטציה פעילה</span>
                        <Badge className="bg-blue-500 text-[10px]">3/3 Keys</Badge>
                    </div>
                </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6 rounded-[2rem] flex-1">
                <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2"><Clock size={16}/> היסטוריית לוגים</h3>
                <div className="space-y-3 opacity-40 text-[10px] font-mono leading-tight">
                    <p className="text-green-500">[02:30] SYSTEM: Rules reloaded.</p>
                    <p>[03:10] AI: Analyzed morning dispatch.</p>
                    <p className="text-orange-500">[03:12] ALERT: Late delivery risk detected.</p>
                    <p>[03:15] LOG: Database sync successful.</p>
                </div>
            </Card>
        </aside>
      </div>
    </div>
  );
}
