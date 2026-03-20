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
  Terminal, RefreshCw, Database, Plus, Trash2,
  Settings2, Activity, Menu, X, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function SabanSuperBrainCenter() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    return () => { supabase.removeChannel(rulesChannel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadInitialData = async () => {
    try {
      const { data: rulesData } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true).order('created_at', { ascending: false });
      const { data: reqs } = await supabase.from('saban_requests').select('id, status');
      setRules(rulesData || []);
      setStats({ orders: reqs?.length || 0, pending: reqs?.filter(r => r.status === 'pending').length || 0, health: '99.9%' });
    } catch (error) { console.error(error); }
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.desc) return toast.error("מלא את כל השדות");
    try {
      const { error } = await supabase.from('saban_brain_rules').insert([
        { rule_name: newRule.name, rule_description: newRule.desc, is_active: true }
      ]);
      if (error) throw error;
      setNewRule({ name: '', desc: '' });
      setIsAddingRule(false);
      toast.success("החוק נוסף בהצלחה");
    } catch (e) { toast.error("שגיאה בשמירה"); }
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
    } catch (e) { toast.error("תקלה במוח"); } finally { setIsTyping(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden flex flex-col" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Top Navbar */}
      <nav className="h-16 md:h-20 border-b bg-white/80 backdrop-blur-md sticky top-0 z-[60] flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <Brain size={24} className="text-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg md:text-xl font-black italic uppercase leading-none">SABAN <span className="text-blue-600 font-black">SUPERBRAIN</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Core v6.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px] hidden sm:flex">SYSTEM_ONLINE</Badge>
          <Button variant="ghost" size="icon" onClick={loadInitialData} className="rounded-full">
            <RefreshCw size={18} className="text-slate-400" />
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed inset-0 z-[70] bg-white w-full flex flex-col p-6 shadow-2xl md:hidden"
            >
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h3 className="font-black text-xl uppercase italic">ספר חוקים</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={24}/></button>
              </div>
              
              <Button onClick={() => setIsAddingRule(true)} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl mb-6 flex items-center gap-2">
                <Plus size={20}/> הוסף חוק חדש
              </Button>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {rules.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 border rounded-2xl relative">
                    <button onClick={() => deleteRule(r.id)} className="absolute top-3 left-3 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    <p className="font-black text-sm uppercase mb-1">{r.rule_name}</p>
                    <p className="text-xs font-bold text-slate-500 italic leading-relaxed">{r.rule_description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[350px] border-l bg-white flex-col p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-blue-600 flex items-center gap-2 uppercase tracking-widest">
              <ShieldCheck size={16}/> ספר חוקים פעיל
            </h3>
            <button onClick={() => setIsAddingRule(true)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {rules.map((r) => (
              <motion.div layout key={r.id} className="group bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{r.rule_name}</span>
                  <button onClick={() => deleteRule(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">{r.rule_description}</p>
              </motion.div>
            ))}
          </div>
        </aside>

        {/* Main Terminal Area */}
        <main className="flex-1 flex flex-col bg-slate-100/50 overflow-hidden relative">
          
          {/* Rules Form Overlay */}
          <AnimatePresence>
            {isAddingRule && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
              >
                <Card className="w-full max-w-lg p-8 bg-white rounded-[2.5rem] shadow-2xl border-none">
                  <h3 className="text-2xl font-black italic uppercase mb-6 text-center">הוספת חוק ל-DNA</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2">שם החוק (כותרת)</label>
                      <Input 
                        placeholder="למשל: פתיחת הזמנה..." 
                        className="h-14 bg-white border-2 border-slate-100 text-slate-900 font-black rounded-2xl px-6 focus:ring-4 ring-blue-50" 
                        value={newRule.name} 
                        onChange={e => setNewRule({...newRule, name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2">תיאור הפעולה למוח</label>
                      <textarea 
                        placeholder="הסבר ל-AI איך להתנהג..." 
                        className="w-full h-32 bg-white border-2 border-slate-100 text-slate-900 font-bold rounded-2xl p-6 focus:ring-4 ring-blue-50 outline-none resize-none" 
                        value={newRule.desc} 
                        onChange={e => setNewRule({...newRule, desc: e.target.value})} 
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95" onClick={handleAddRule}>
                        שמור חוק ב-DB
                      </Button>
                      <Button variant="ghost" className="h-14 font-black rounded-2xl px-8" onClick={() => setIsAddingRule(false)}>ביטול</Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <Sparkles size={60} className="mb-4 text-blue-600" />
                <p className="font-black text-2xl tracking-tighter uppercase text-slate-900">Neural Link Active</p>
                <p className="text-sm font-black italic">ראמי, המוח מחכה לפקודה לוגיסטית...</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[90%] md:max-w-[80%] p-5 md:p-7 rounded-[1.8rem] shadow-sm relative ${
                    m.role === 'user' ? 'bg-white border-2 border-slate-200 text-slate-900 rounded-tr-none' : 'bg-slate-900 text-white rounded-tl-none'
                  }`}>
                    <div className={`flex items-center gap-2 mb-2 text-[9px] font-black uppercase tracking-widest ${m.role === 'user' ? 'text-blue-600' : 'text-blue-400'}`}>
                      {m.role === 'user' ? <Settings2 size={12}/> : <Zap size={12}/>}
                      {m.role === 'user' ? 'ADMIN_SABAN' : 'AI_INTERNAL_CORE'}
                    </div>
                    <div className="whitespace-pre-wrap font-black leading-relaxed tracking-tight text-base md:text-lg uppercase-msg">
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex justify-end px-4">
                <div className="bg-slate-900/5 px-4 py-2 rounded-full text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                  מעבד סימולציית נתונים...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-8 bg-white border-t">
            <div className="max-w-4xl mx-auto flex gap-3">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
                placeholder="כתוב פקודה ראמי..."
                className="h-14 md:h-16 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-900 font-black text-base md:text-xl px-6 focus:ring-4 ring-blue-50 placeholder:text-slate-400 transition-all"
              />
              <Button onClick={handleCommand} disabled={isTyping} className="h-14 md:h-16 w-14 md:w-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-100 active:scale-90 transition-all shrink-0">
                <Send size={24} />
              </Button>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .uppercase-msg { letter-spacing: -0.02em; }
      `}</style>
    </div>
  );
}
