"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, History, MessageSquare, Send, MapPin, 
  Navigation, Bell, PackagePlus, Loader2, Sparkles, 
  User, Phone, ChevronDown, CheckCircle2, LayoutGrid, // <--- נוסף LayoutGrid
  RefreshCcw, Trash2, PlusSquare // <--- נוספו אייקונים לגיבוי
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanChameleonApp() {
  const { customerId } = useParams();
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      // 1. שליפת לקוח
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      setCustomer(client);
      
      // 2. שליפת פרויקטים (עם טיפול במקרה שהטבלה לא קיימת עדיין)
      const { data: projs, error: projError } = await supabase.from('saban_projects').select('*').eq('customer_id', customerId);
      
      if (!projError) {
        setProjects(projs || []);
        if (projs && projs.length > 0) setSelectedProject(projs[0]);
      }
    } catch (e) {
      console.error("Saban Error:", e);
    } finally {
      setLoading(false);
    }
  }, [customerId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAiConversation = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsAiThinking(true);

    setTimeout(async () => {
      let aiText = "";
      if (step === 0) {
        aiText = `אהלן בר! אני רואה שאתה רוצה להקים פרויקט חדש. איך נקרא לו? (למשל: אורניל-מהלה)`;
        setStep(1);
      } else if (step === 1) {
        aiText = `קיבלתי. '${userMsg}' נשמע מצוין. מה הכתובת המדויקת?`;
        setStep(2);
      } else if (step === 2) {
        aiText = `הכל מוכן! הפרויקט הוקם במערכת של ראמי. המיקום נשמר לנהג. רוצה להזמין מכולה ראשונה?`;
        setStep(3);
      }
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
      setIsAiThinking(false);
    }, 1500);
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center font-black italic text-blue-700 animate-pulse text-xl uppercase tracking-tighter">
        Saban Client Air...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans pb-32 text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- Header --- */}
      <header className="p-6 flex items-center justify-between sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100">
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-slate-50 rounded-2xl border-none bg-transparent cursor-pointer"><Menu size={24}/></button>
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black italic text-blue-700 tracking-tighter leading-none uppercase">SABAN OS</h1>
            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black italic mt-1 uppercase">Premium Hub</Badge>
        </div>
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600">
            <User size={24}/>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <section>
                <h2 className="text-3xl font-black text-slate-800 italic tracking-tight">שלום, {customer?.full_name?.split(' ')[0] || 'בר'} 👋</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{customer?.address || 'חברת ח. סבן'}</p>
            </section>

            {/* בורר פרויקטים */}
            <section className="space-y-4">
                <div className="relative">
                    <select 
                        onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
                        className="w-full p-6 rounded-[2.5rem] bg-white border-2 border-slate-50 font-black italic appearance-none outline-none shadow-xl text-blue-900"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                        {projects.length === 0 && <option>פרויקט ברירת מחדל</option>}
                    </select>
                    <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" />
                </div>
            </section>

            {/* כפתורי פעולה WOW */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('chat'); setStep(0); }} className="aspect-square bg-white border-none rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all group cursor-pointer">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-white group-hover:text-blue-600 shadow-inner"><PackagePlus size={32}/></div>
                    <span className="font-black italic text-sm">הקמת פרויקט</span>
                </button>
                <button onClick={() => setActiveTab('chat')} className="aspect-square bg-white border-none rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:text-white transition-all group cursor-pointer">
                    <div className="p-5 bg-slate-50 text-slate-300 rounded-3xl group-hover:bg-white group-hover:text-slate-800 shadow-inner"><MessageSquare size={32}/></div>
                    <span className="font-black italic text-sm">שיחה עם AI</span>
                </button>
            </div>
          </div>
        )}

        {/* --- AI Chat --- */}
        {activeTab === 'chat' && (
            <div className="h-[70vh] flex flex-col animate-in slide-in-from-left duration-500">
                <div className="flex-1 overflow-y-auto space-y-6 p-2 no-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-20 opacity-20 font-black italic">הצאט ריק. בחר פעולה או כתוב משהו...</div>
                    )}
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${
                                m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none italic'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isAiThinking && <Loader2 className="animate-spin text-blue-600 mx-auto" />}
                </div>
                <div className="p-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 flex gap-2 mt-4 items-center">
                    <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiConversation()}
                        placeholder="כתוב פקודה..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-right px-4"
                    />
                    <button onClick={handleAiConversation} className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg border-none cursor-pointer"><Send size={20}/></button>
                </div>
            </div>
        )}
      </main>

      {/* --- Floating Bottom Nav --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-[150]">
        <div className="bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[3rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex justify-around items-center px-12 ring-8 ring-black/5">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all border-none bg-transparent outline-none cursor-pointer ${activeTab === 'home' ? 'text-blue-700 scale-125' : 'text-slate-300'}`}>
            <LayoutGrid size={28} />
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center transition-all border-none bg-transparent outline-none cursor-pointer ${activeTab === 'chat' ? 'text-blue-700 scale-125' : 'text-slate-300'}`}>
            <MessageSquare size={28} />
          </button>
        </div>
      </nav>
    </div>
  );
}
