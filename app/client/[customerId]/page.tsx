"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, History, MessageSquare, Send, MapPin, 
  Navigation, Bell, PackagePlus, Loader2, Sparkles, 
  User, Phone, ChevronDown, CheckCircle2, LayoutGrid,
  RefreshCcw, Trash2, PlusSquare, ArrowRight, Hash
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- סוגי נתונים ---
type Message = { role: 'ai' | 'user'; text: string; action?: any };

export default function SabanFinalClientApp() {
  const { customerId } = useParams();
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [step, setStep] = useState<'IDLE' | 'NEW_PROJ_NAME' | 'NEW_PROJ_ADDR'>('IDLE');
  const [loading, setLoading] = useState(true);
  
  const supabase = getSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- אוטומציה: גלילה לסוף הצאט ---
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
  }, [chatHistory, isAiThinking]);

  // --- שליפת נתונים מקיפה ---
  const fetchData = useCallback(async () => {
    if (!customerId) return;
    try {
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).maybeSingle();
      const { data: projs } = await supabase.from('saban_projects').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
      
      setCustomer(client);
      setProjects(projs || []);
      if (projs && projs.length > 0 && !selectedProject) setSelectedProject(projs[0]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [customerId, supabase, selectedProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- לוגיקה: פקודות AI ושליפת מכולות קיימות ---
  const processCommand = async (input: string) => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsAiThinking(true);

    // השהיית חשיבה אנושית
    await new Promise(r => setTimeout(r, 1200));

    let aiResponse = "";

    try {
      // תרחיש 1: הקמת פרויקט חדש
      if (step === 'NEW_PROJ_NAME') {
        aiResponse = `קיבלתי. '${userMsg}' נשמע מצוין. מה הכתובת המדויקת?`;
        setStep('NEW_PROJ_ADDR');
        // שמירת השם זמנית בסטייט או בנתוני הפעולה
      } 
      else if (step === 'NEW_PROJ_ADDR') {
        const projName = chatHistory[chatHistory.length - 2].text;
        // שליחת מיקום אמיתי
        const pos: any = await new Promise((res) => navigator.geolocation.getCurrentPosition(res, () => res(null)));
        const waze = pos ? `https://waze.com/ul?ll=${pos.coords.latitude},${pos.coords.longitude}&navigate=yes` : '';
        
        await supabase.from('saban_projects').insert([{
            customer_id: customerId,
            project_name: projName,
            address: userMsg,
            waze_link: waze,
            contact_person: customer?.full_name?.split(' ')[0] || 'בר'
        }]);
        
        aiResponse = `הכל מוכן! הפרויקט '${projName}' הוקם. המיקום נשמר לראמי. רוצה להזמין מכולה ראשונה?`;
        setStep('IDLE');
        fetchData();
      }
      // תרחיש 2: בקשת החלפה/פינוי - שליפה חכמה מה-DB
      else if (userMsg.includes("החלפה") || userMsg.includes("פינוי")) {
        const { data: activeContainers } = await supabase.from('saban_master_dispatch')
            .select('*')
            .eq('customer_id', customerId)
            .eq('address', selectedProject?.address)
            .neq('status', 'סופקה');

        if (activeContainers && activeContainers.length > 0) {
            const lastOne = activeContainers[0];
            aiResponse = `זיהיתי שיש לך מכולה ב${lastOne.address} (מספר ${lastOne.order_id_comax}). שולח לראמי בקשת ${userMsg} דחופה?`;
            // שליחת בקשה למלשינון
            await supabase.from('saban_customer_requests').insert([{
                customer_id: customerId,
                action_type: userMsg.includes("החלפה") ? 'EXCHANGE' : 'DISPOSAL',
                details: lastOne
            }]);
        } else {
            aiResponse = `לא מצאתי מכולה פעילה בכתובת הזו. תרצה שאפתח הזמנה ל'הצבה' חדשה?`;
        }
      }
      else {
        aiResponse = `אהלן בר, אני המוח של ח. סבן. אני יודע להקים פרויקטים, לבקש החלפות או פינויים. מה נבצע היום?`;
      }
    } catch (e) { aiResponse = "סליחה, הייתה לי תקלה קטנה בחיבור. נסה שוב?"; }

    setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsAiThinking(false);
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center font-black text-blue-700 italic animate-pulse">
        <Sparkles className="mb-4" size={48}/>
        SABAN OS CONNECTING...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-32 text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- Header יוקרתי --- */}
      <header className="p-6 flex items-center justify-between sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-slate-50 rounded-2xl border-none cursor-pointer hover:bg-slate-100 transition-all"><Menu size={24}/></button>
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black italic text-blue-700 tracking-tighter leading-none">SABAN OS</h1>
            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black italic mt-1 uppercase">Premium Hub</Badge>
        </div>
        <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <User size={24}/>
        </div>
      </header>

      {/* --- Side Menu --- */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex justify-end">
              <aside className="w-80 bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300 flex flex-col">
                  <div className="flex justify-between items-center mb-12">
                      <span className="font-black italic text-blue-700">תפריט Premium</span>
                      <button onClick={() => setIsMenuOpen(false)} className="bg-slate-50 p-2 rounded-full border-none cursor-pointer"><X size={20}/></button>
                  </div>
                  <nav className="space-y-4 flex-1">
                      <button onClick={() => {setActiveTab('home'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-400'}`}>
                          <LayoutGrid size={22}/> מרכז בקרה
                      </button>
                      <button onClick={() => {setActiveTab('chat'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-400'}`}>
                          <MessageSquare size={22}/> צ'אט AI & פקודות
                      </button>
                  </nav>
              </aside>
          </div>
      )}

      <main className="p-6 max-w-lg mx-auto space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Chameleon Project Selector */}
            <section>
                <h2 className="text-xl font-black text-slate-800 italic mb-4">הפרויקט הנבחר:</h2>
                <div className="relative group">
                    <select 
                        value={selectedProject?.id}
                        onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
                        className="w-full p-6 rounded-[2.5rem] bg-white border-2 border-blue-50 font-black italic appearance-none outline-none shadow-xl text-blue-900 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                        {projects.length === 0 && <option>פרויקט אבי (ברירת מחדל)</option>}
                    </select>
                    <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" />
                </div>
            </section>

            {/* Project Card */}
            {selectedProject && (
                <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl relative overflow-hidden ring-1 ring-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg"><MapPin size={24}/></div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 italic leading-none">{selectedProject.project_name}</h3>
                            <p className="text-xs font-bold text-slate-400 mt-2">{selectedProject.address}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase italic mb-6">
                        <div className="flex items-center gap-2"><User size={14} className="text-blue-500"/> {selectedProject.contact_person}</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {customer?.phone}</div>
                    </div>
                    <button onClick={() => window.open(selectedProject.waze_link)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200">
                        <Navigation size={18} fill="currentColor"/> ניווט מהיר Waze
                    </button>
                </Card>
            )}

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('chat'); setStep('NEW_PROJ_NAME'); setChatHistory([{role:'ai', text: 'אהלן! איזה פרויקט נקים היום?'}]); }} className="aspect-square bg-white border-none rounded-[3rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all group cursor-pointer border-2 border-transparent">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-white group-hover:text-blue-600 shadow-inner"><PackagePlus size={32}/></div>
                    <span className="font-black italic text-sm">פרויקט חדש</span>
                </button>
                <button onClick={() => { setActiveTab('chat'); setChatHistory([{role:'ai', text: 'שלום בר, איך אוכל לעזור בפרויקט הנוכחי?'}]); }} className="aspect-square bg-white border-none rounded-[3rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:text-white transition-all group cursor-pointer border-2 border-transparent text-slate-300">
                    <div className="p-5 bg-slate-50 text-slate-300 rounded-3xl group-hover:bg-white group-hover:text-slate-800 shadow-inner"><Truck size={32}/></div>
                    <span className="font-black italic text-sm">הזמנה דחופה</span>
                </button>
            </div>
          </div>
        )}

        {/* --- AI Intelligence View --- */}
        {activeTab === 'chat' && (
            <div className="h-[75vh] flex flex-col animate-in slide-in-from-left duration-500">
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 p-2 no-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-20 opacity-20 font-black italic">התחל שיחה עם המוח של סבן...</div>
                    )}
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2.5rem] font-bold text-sm shadow-sm ${
                                m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-50 text-slate-800 rounded-bl-none italic'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                            <div className="bg-slate-50 p-5 rounded-3xl shadow-sm flex gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white rounded-[3rem] shadow-2xl border border-slate-50 flex gap-2 mt-4 items-center ring-4 ring-blue-50/50">
                    <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && processCommand(chatInput)}
                        placeholder="כתוב הודעה..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-right px-6 h-12"
                    />
                    <button onClick={() => processCommand(chatInput)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all border-none cursor-pointer">
                        <Send size={22}/>
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* --- Global Bottom Navigation --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-[150]">
        <div className="bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[3rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex justify-around items-center px-12 ring-8 ring-black/5">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all border-none bg-transparent outline-none cursor-pointer ${activeTab === 'home' ? 'text-blue-600 scale-125' : 'text-slate-300'}`}>
            <LayoutGrid size={28} />
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center transition-all border-none bg-transparent outline-none cursor-pointer ${activeTab === 'chat' ? 'text-blue-600 scale-125' : 'text-slate-300'}`}>
            <MessageSquare size={28} />
          </button>
        </div>
      </nav>
    </div>
  );
}
