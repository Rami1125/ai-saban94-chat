"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Sparkles, Brain, Zap, ShieldCheck, 
  Terminal, RefreshCw, Database, Plus, Trash2, Save,
  Layers, Settings2, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function SabanSuperBrainCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', desc: '' });
  const [stats, setStats] = useState({ orders: 0, pending: 0, health: '100%' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();

  useEffect(() => {
    loadInitialData();
    const rulesChannel = supabase.channel('rules_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_brain_rules' }, () => {
        loadInitialData();
        toast.success("ספר החוקים עודכן");
      }).subscribe();

    const requestsChannel = supabase.channel('brain_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, () => loadInitialData())
      .subscribe();

    return () => { 
      supabase.removeChannel(rulesChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadInitialData = async () => {
    try {
      const { data: rulesData } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true).order('created_at', { ascending: false });
      const { data: reqs } = await supabase.from('saban_requests').select('id, status');
      setRules(rulesData || []);
      setStats({ orders: reqs?.length || 0, pending: reqs?.filter(r => r.status === 'pending').length || 0, health: '99.8%' });
    } catch (error) { console.error(error); }
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.desc) return toast.error("מלא את כל שדות החוק");
    try {
      const { error } = await supabase.from('saban_brain_rules').insert([
        { rule_name: newRule.name, rule_description: newRule.desc, is_active: true }
      ]);
      if (error) throw error;
      setNewRule({ name: '', desc: '' });
      setIsAddingRule(false);
      toast.success("החוק נוסף ל-DNA של המוח");
    } catch (e) { toast.error("שגיאה בהוספת חוק"); }
  };

  const deleteRule = async (id: string) => {
    try {
      await supabase.from('saban_brain_rules').delete().eq('id', id);
      toast.info("החוק הוסר");
    } catch (e) { toast.error("שגיאה במחיקה"); }
  };

  const handleCommand = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    try {
      const response = await SabanBrain.ask(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: "תקלה בסינפסות, נסה שוב ראמי." }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-left" richColors theme="dark" />
      
      {/* Navbar - Glass Effect */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight italic text-white uppercase flex items-center gap-2">
              SABAN <span className="text-blue-400">SuperBrain</span>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">PRO_EXEC</Badge>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hybrid Neural Core v5.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={loadInitialData}>
            <RefreshCw size={16} />
          </Button>
          <div className="h-8 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase leading-none">Status</p>
              <p className="text-xs font-bold text-emerald-400">ONLINE</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1700px] mx-auto w-full p-6 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Sidebar - Knowledge Base & Rules */}
        <aside className="col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[2.5rem] backdrop-blur-xl border-t-blue-500/20 border-t-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                    <ShieldCheck size={16}/> ספר חוקים פעיל
                  </h3>
                  <button onClick={() => setIsAddingRule(!isAddingRule)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                      {isAddingRule && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 bg-white/5 p-4 rounded-2xl border border-blue-500/20 mb-4 overflow-hidden">
                          <Input placeholder="שם החוק..." className="h-9 bg-slate-950/50 border-white/10 text-xs" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} />
                          <textarea placeholder="תיאור הפעולה..." className="w-full h-20 bg-slate-950/50 border border-white/10 rounded-lg p-2 text-xs outline-none focus:ring-1 ring-blue-500" value={newRule.desc} onChange={e => setNewRule({...newRule, desc: e.target.value})} />
                          <div className="flex gap-2">
                            <Button className="flex-1 h-8 text-[10px] bg-blue-600 hover:bg-blue-500" onClick={handleAddRule}>שמור חוק</Button>
                            <Button variant="ghost" className="h-8 text-[10px]" onClick={() => setIsAddingRule(false)}>ביטול</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {rules.map((r, i) => (
                        <motion.div layout key={r.id} className="group relative bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-all">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-[11px] font-black text-white/90 uppercase tracking-tighter">{r.rule_name}</div>
                              <button onClick={() => deleteRule(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                              {r.rule_description}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-600/10 to-transparent border-white/5 p-6 rounded-[2.5rem]">
                <h3 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Database size={16}/> סטטוס תפעולי
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black text-white">{stats.orders}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">פעולות AI</div>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                        <div className="text-2xl font-black text-orange-400">{stats.pending}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">ממתין לביצוע</div>
                    </div>
                </div>
            </Card>
        </aside>

        {/* Center - Terminal Hybrid Design */}
        <main className="col-span-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl relative">
                {/* Terminal Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
                   <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                      </div>
                      <div className="h-4 w-[1px] bg-white/10 mx-2" />
                      <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Core_Terminal.exe</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-300">STREAM_ON</Badge>
                   </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gradient-to-b from-slate-950/20 to-transparent">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                            <Sparkles size={80} className="mb-6 text-blue-500 animate-pulse" />
                            <p className="font-black text-3xl tracking-tighter uppercase text-white">Neural Link Active</p>
                            <p className="text-sm mt-2 font-medium italic">ראמי, המוח מחכה לפקודה לוגיסטית...</p>
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] text-[15px] font-bold shadow-2xl relative ${
                                    m.role === 'user' ? 'bg-white/5 border border-white/10 text-slate-300 rounded-tr-none' : 'bg-blue-600 text-white shadow-blue-500/20 rounded-tl-none'
                                }`}>
                                    <div className={`flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-widest opacity-60 ${m.role === 'user' ? 'text-blue-400' : 'text-blue-100'}`}>
                                        {m.role === 'user' ? <Settings2 size={12}/> : <Zap size={12}/>}
                                        {m.role === 'user' ? 'RAMI_SABAN' : 'AI_INTERNAL_CORE'}
                                    </div>
                                    <div className="whitespace-pre-wrap leading-relaxed tracking-tight">{m.content}</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end px-4">
                            <div className="bg-blue-500/10 px-6 py-3 rounded-full text-[10px] font-black uppercase text-blue-400 flex items-center gap-3 border border-blue-500/20">
                              <div className="flex gap-1">
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                              סימולציית נתוני שטח...
                            </div>
                        </motion.div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area - Pure Modern */}
                <div className="p-8 bg-slate-900/60 border-t border-white/5 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex gap-4 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                            placeholder="פקודה לביצוע ראמי..."
                            className="h-16 rounded-[1.5rem] bg-slate-950 border-white/10 text-white font-bold text-lg px-8 focus:ring-2 ring-blue-500/50 transition-all placeholder:text-slate-600 relative z-10"
                        />
                        <Button onClick={handleCommand} disabled={isTyping} className="h-16 w-16 bg-blue-600 hover:bg-blue-500 rounded-[1.5rem] shrink-0 shadow-lg shadow-blue-500/40 transition-all active:scale-95 relative z-10">
                            <Send size={24} />
                        </Button>
                    </div>
                </div>
            </div>
        </main>

        {/* Right Sidebar - System Stats */}
        <aside className="col-span-3 flex flex-col gap-6">
            <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[2.5rem] border-r-blue-500/20 border-r-2 backdrop-blur-md">
                <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-blue-400"/> System Metrics
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Uptime</span>
                        <span className="text-xl font-black text-emerald-400">99.9%</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Latency</span>
                        <span className="text-xl font-black text-blue-400">42ms</span>
                    </div>
                    
                    <div className="pt-4 space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                            <span>AI Load</span>
                            <span className="text-blue-400">24%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '24%' }} className="bg-blue-500 h-full" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                            <span>Memory Usage</span>
                            <span className="text-cyan-400">1.2GB</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                             <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="bg-cyan-500 h-full" />
                          </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[2.5rem] flex items-center justify-center group cursor-pointer hover:bg-slate-800 transition-all">
                <div className="text-center">
                   <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                      <Layers className="text-blue-400" size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Switch Mode</p>
                   <p className="text-xs font-bold text-white">Saban Logistics v5</p>
                </div>
            </Card>
        </aside>
      </div>
    </div>
  );
}
