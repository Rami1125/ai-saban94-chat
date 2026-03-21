"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, History, MessageSquare, Send, MapPin, 
  Navigation, Bell, PackagePlus, Loader2, Sparkles, 
  User, Phone, ChevronDown, CheckCircle2, Volume2, LayoutGrid
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- סוגי נתונים ---
type Message = {
    role: 'ai' | 'user';
    text: string;
    chameleonColor?: string; // צבע דינמי לצאט
};

export default function SabanChameleonApp() {
  const { customerId } = useParams();
  const [activeTab, setActiveTab] = useState<'home' | 'chat'>('home');
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  const supabase = getSupabase();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- אוטומציה: גלילה לסוף הצאט ---
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isAiThinking]);

  // --- אישור הרשאות OneSignal חד פעמי ---
  useEffect(() => {
    // דימוי הרשאת OneSignal (במציאות זה רץ ב-layout או בקומפוננטה ייעודית)
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                toast.success("הרשאת התראות הופעלה!");
            }
        });
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;
    const fetchData = async () => {
      // שליפת לקוח ופרויקטים
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).single();
      setCustomer(client);
      
      const { data: projs } = await supabase.from('saban_projects').select('*').eq('customer_id', customerId);
      setProjects(projs || []);
      if (projs && projs.length > 0) setSelectedProject(projs[0]);
    };
    fetchData();
    setLoading(false);
  }, [customerId, supabase]);

  // --- לוגיקה: צ'אט AI אנושי (זיקית) ---
  const handleAiConversation = async (presetCommand?: string) => {
    const input = presetCommand || chatInput;
    if (!input.trim() || isAiThinking) return;
    
    // 1. הוספת הודעת המשתמש
    const userMsg: Message = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    if (!presetCommand) setActiveTab('chat'); // עבור לצאט אם זה לא כפתור מהיר

    // 2. הפעלת "חשיבה"
    setIsAiThinking(true);

    // אפקט מחשבה אנושי (1-3 שניות)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

    let aiResponse = "";
    let color = "bg-white"; // ברירת מחדל

    // 3. לוגיקת AI (מדומה - כאן נחבר API בעתיד)
    if (input.includes("פרויקט חדש")) {
        aiResponse = `אהלן בר! אני רואה שאתה רוצה להקים פרויקט חדש. איך נקרא לו? (למשל: אורניל-מהלה)`;
        color = "bg-emerald-50"; // צבע ירוק להקמה
    } else if (input.includes("אורניל-מהלה")) {
        aiResponse = `קיבלתי. '${input}' נשמע מצוין. מה הכתובת המדויקת ברעננה?`;
        color = "bg-blue-50";
    } else if (input.includes("ויצמן 4")) {
        // שליפת מיקום (GPS מוכן)
        aiResponse = `הכל מוכן! הפרויקט בויצמן 4 הוקם במערכת של ראמי. שמרתי גם את המיקום שלך לנהג (Waze מוכן). רוצה להזמין מכולה ראשונה?`;
        color = "bg-orange-50"; // כתום לפעולה
    } else if (input.includes("כן")) {
        aiResponse = `אחלה. הצבה של מכולה חדשה? (או סוג אחר, פשוט תגיד).`;
    } else {
        aiResponse = `שלום בר, אני המוח של ח. סבן. אני יודע להקים פרויקטים חדשים בצאט. פשוט תגיד לי: "אני רוצה להקים פרויקט חדש".`;
    }

    // 4. הוספת הודעת ה-AI
    const aiMsg: Message = { role: 'ai', text: aiResponse, chameleonColor: color };
    setChatHistory(prev => [...prev, aiMsg]);
    setIsAiThinking(false);

    // צליל התראה קצר
    new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
  };

  // עיצוב משתנה לפי פרויקט (Chameleon Effect)
  const getProjectTheme = () => {
    if (selectedProject?.project_name?.includes('מהלה')) return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    return 'bg-blue-50 border-blue-200 text-blue-900';
  };

  return (
    <div className={`min-h-screen ${selectedProject ? 'bg-slate-50' : 'bg-white'} font-sans pb-32 text-right transition-colors duration-1000`} dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- Header (Glassmorphism) --- */}
      <header className="p-6 flex items-center justify-between sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 shadow-sm">
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-slate-50 rounded-2xl border-none text-slate-400 hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"><Menu size={24}/></button>
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black italic text-blue-700 tracking-tighter leading-none">SABAN OS</h1>
            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black italic mt-1 uppercase">Premium Hub</Badge>
        </div>
        <div className="flex gap-2">
            <button className="p-3 bg-slate-50 rounded-2xl border-none text-slate-400 hover:text-blue-600 transition-all cursor-pointer relative"><Bell size={24}/><div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></button>
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><User size={24}/></div>
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
                      <button onClick={() => {setActiveTab('home'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black transition-all border-none cursor-pointer ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-slate-50 text-slate-400 bg-transparent'}`}>
                          <LayoutGrid size={22}/> מרכז בקרה
                      </button>
                      <button onClick={() => {setActiveTab('chat'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] font-black transition-all border-none cursor-pointer ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'hover:bg-slate-50 text-slate-400 bg-transparent'}`}>
                          <MessageSquare size={22}/> צ'אט AI & פקודות
                      </button>
                  </nav>
              </aside>
          </div>
      )}

      <main className="p-6 max-w-lg mx-auto space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* בורר פרויקטים (זיקית) */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-slate-800 italic">הפרויקטים שלי</h2>
                    <Sparkles className="text-blue-500 animate-pulse" size={20}/>
                </div>
                <div className="relative group">
                    <select 
                        onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
                        className={`w-full p-6 rounded-[2.5rem] border-2 font-black italic appearance-none outline-none transition-all shadow-xl cursor-pointer ${getProjectTheme()}`}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                        {projects.length === 0 && <option>אין פרויקטים פעילים</option>}
                    </select>
                    <ChevronDown className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30" />
                </div>
            </section>

            {/* כרטיס פרויקט מורחב */}
            {selectedProject && (
                <Card className="p-8 rounded-[3rem] bg-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><MapPin size={24}/></div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 italic">{selectedProject.project_name}</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">{selectedProject.address}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase italic mb-6">
                            <div className="flex items-center gap-2"><User size={14} className="text-blue-500"/> {selectedProject.contact_person}</div>
                            <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {selectedProject.phone}</div>
                        </div>
                        <button 
                            onClick={() => window.open(selectedProject.waze_link)}
                            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-200 border-none cursor-pointer"
                        >
                            <Navigation size={18} fill="currentColor"/> ניווט מהיר Waze
                        </button>
                    </div>
                </Card>
            )}

            {/* כפתורי קיצור - פעולות WOW */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('chat'); setChatHistory([{role:'ai', text: 'אהלן בר! פשוט תגיד לי: "אני רוצה להקים פרויקט חדש" ונצא לדרך.'}]); }} className="aspect-square bg-white border-none rounded-[3rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all group active:scale-95 cursor-pointer">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-white group-hover:text-blue-600 shadow-inner"><PackagePlus size={32}/></div>
                    <span className="font-black italic text-sm tracking-tight text-right">הקמת פרויקט</span>
                </button>
                <button onClick={() => setActiveTab('chat')} className="aspect-square bg-white border-none rounded-[3rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:text-white transition-all group active:scale-95 cursor-pointer text-slate-300">
                    <div className="p-5 bg-slate-50 text-slate-300 rounded-3xl group-hover:bg-white group-hover:text-slate-800 shadow-inner"><Truck size={32}/></div>
                    <span className="font-black italic text-sm tracking-tight text-right">דבר עם המוח</span>
                </button>
            </div>
          </div>
        )}

        {/* --- AI Chat View (Chameleon) --- */}
        {activeTab === 'chat' && (
            <div className="h-[75vh] flex flex-col animate-in slide-in-from-left duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 italic flex items-center gap-2"><Brain className="text-blue-600"/> המוח של סבן</h2>
                    <Volume2 className="text-slate-300"/>
                </div>
                <div className="flex-1 overflow-y-auto space-y-6 p-2 no-scrollbar">
                    {chatHistory.length === 0 && (
                        <div className="text-center py-20 opacity-20 font-black italic">הצאט ריק. בחר פעולה או כתוב פקודה...</div>
                    )}
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2.5rem] font-bold text-sm shadow-sm ${
                                m.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : `bg-white border border-slate-100 text-slate-800 rounded-bl-none ${m.chameleonColor || 'bg-white'}`
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
                    <div ref={chatEndRef} /> {/* גלילה לסוף הצאט */}
                </div>
                
                <div className="p-4 bg-white rounded-[3rem] shadow-2xl border border-slate-50 flex gap-2 mt-4 items-center ring-4 ring-blue-50/50">
                    <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiConversation()}
                        placeholder="כתוב הודעה או פקודה..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-right px-6 h-12"
                    />
                    <button 
                        onClick={() => handleAiConversation()}
                        className="bg-blue-600 text-white p-4 rounded-full shadow-lg active:scale-90 transition-all border-none cursor-pointer"
                    >
                        <Send size={22}/>
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* --- Floating Bottom Navigation (Air Glass) --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-[150]">
        <div className="bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[3rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex justify-around items-center px-12 ring-8 ring-black/5">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all border-none bg-transparent ${activeTab === 'home' ? 'text-blue-700 scale-125' : 'text-slate-300'}`}>
            <LayoutGrid size={28} />
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all border-none bg-transparent ${activeTab === 'chat' ? 'text-blue-700 scale-125' : 'text-slate-300'}`}>
            <MessageSquare size={28} />
          </button>
        </div>
      </nav>
    </div>
  );
}
