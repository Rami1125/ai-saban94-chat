"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { useParams } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Truck, History, MessageSquare, Send, MapPin, 
  Navigation, Bell, PackagePlus, Loader2, Sparkles, 
  User, Phone, ChevronDown, CheckCircle2, Volume2
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
  const [step, setStep] = useState(0); // שלבי ה-AI
  
  const supabase = getSupabase();

  // --- אישור הרשאות חד פעמי ---
  const requestPermissions = async () => {
    // הרשאת מיקום
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(() => {
        toast.success("הרשאת מיקום אושרה!");
      });
    }
    // הרשאת OneSignal/Notifications
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') toast.success("התראות הופעלו!");
    }
  };

  useEffect(() => {
    if (!customerId) return;
    const fetchData = async () => {
      // שליפת לקוח ופרויקטים (טבלה חדשה שנוצרת דינמית)
      const { data: client } = await supabase.from('saban_customers').select('*').eq('customer_id', customerId).single();
      setCustomer(client);
      
      const { data: projs } = await supabase.from('saban_projects').select('*').eq('customer_id', customerId);
      setProjects(projs || []);
      if (projs && projs.length > 0) setSelectedProject(projs[0]);
    };
    fetchData();
    requestPermissions();
  }, [customerId, supabase]);

  // --- לוגיקה: צ'אט AI אנושי (זיקית) ---
  const handleAiConversation = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsAiThinking(true);

    // אפקט "חשיבה" אנושי
    setTimeout(async () => {
      let aiText = "";
      if (step === 0) {
        aiText = `אהלן בר! אני רואה שאתה רוצה להקים פרויקט חדש. איך נקרא לו? (למשל: אורניל-מהלה)`;
        setStep(1);
      } else if (step === 1) {
        aiText = `קיבלתי. 'אורניל-מהלה' נשמע מצוין. מה הכתובת המדויקת ברעננה?`;
        setStep(2);
      } else if (step === 2) {
        // כאן אנחנו שולמרים את הפרויקט ב-DB ושולחים מיקום
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const wazeLink = `https://waze.com/ul?ll=${pos.coords.latitude},${pos.coords.longitude}&navigate=yes`;
          aiText = `הכל מוכן! הפרויקט בויצמן 4 הוקם. שמרתי גם את המיקום שלך לנהג (Waze מוכן). רוצה להזמין מכולה ראשונה?`;
          
          // שמירה בטבלה
          await supabase.from('saban_projects').insert([{
            customer_id: customerId,
            project_name: 'אורניל-מהלה',
            address: 'ויצמן 4 רעננה',
            waze_link: wazeLink,
            contact_person: 'בר',
            phone: '0508861080'
          }]);
          setStep(3);
        });
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
      setIsAiThinking(false);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    }, 1500);
  };

  // עיצוב משתנה לפי פרויקט (Chameleon Effect)
  const getProjectTheme = () => {
    if (selectedProject?.project_name?.includes('מהלה')) return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    return 'bg-blue-50 border-blue-200 text-blue-900';
  };

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${selectedProject ? 'bg-slate-50' : 'bg-white'} font-sans pb-32 text-right`} dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- App Bar --- */}
      <header className="p-6 flex items-center justify-between sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100">
        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-slate-50 rounded-2xl border-none text-slate-400"><Menu size={24}/></button>
        <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black italic text-blue-700 tracking-tighter leading-none">SABAN OS</h1>
            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black italic mt-1 uppercase">Premium Hub</Badge>
        </div>
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <User size={24}/>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8">
        
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* בורר פרויקטים - זיקית */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-slate-800 italic">הפרויקטים שלי</h2>
                    <Sparkles className="text-blue-500 animate-pulse" size={20}/>
                </div>
                <div className="relative group">
                    <select 
                        onChange={(e) => setSelectedProject(projects.find(p => p.id === e.target.value))}
                        className={`w-full p-6 rounded-[2rem] border-2 font-black italic appearance-none outline-none transition-all shadow-xl ${getProjectTheme()}`}
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
                                <p className="text-xs font-bold text-slate-400">{selectedProject.address}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-black text-slate-500 uppercase italic">
                            <div className="flex items-center gap-2"><User size={14} className="text-blue-500"/> {selectedProject.contact_person}</div>
                            <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500"/> {selectedProject.phone}</div>
                        </div>
                        <button 
                            onClick={() => window.open(selectedProject.waze_link)}
                            className="w-full mt-6 bg-slate-900 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                        >
                            <Navigation size={18} fill="currentColor"/> נווט לפרויקט ב-Waze
                        </button>
                    </div>
                </Card>
            )}

            {/* כפתורי קיצור - פעולות WOW */}
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('chat'); setStep(0); }} className="aspect-square bg-white border-none rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all group active:scale-95">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-white group-hover:text-blue-600 shadow-inner"><PackagePlus size={32}/></div>
                    <span className="font-black italic text-sm tracking-tight">הקמת פרויקט</span>
                </button>
                <button onClick={() => setActiveTab('chat')} className="aspect-square bg-white border-none rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center justify-center gap-4 hover:bg-slate-800 hover:text-white transition-all group active:scale-95 text-slate-400">
                    <div className="p-5 bg-slate-50 text-slate-300 rounded-3xl group-hover:bg-white group-hover:text-slate-800 shadow-inner"><MessageSquare size={32}/></div>
                    <span className="font-black italic text-sm tracking-tight text-slate-300 group-hover:text-white">שיחה עם AI</span>
                </button>
            </div>
          </div>
        )}

        {/* --- AI Chat View (Humanized) --- */}
        {activeTab === 'chat' && (
            <div className="h-[75vh] flex flex-col animate-in slide-in-from-left duration-500">
                <div className="flex-1 overflow-y-auto space-y-6 p-2 no-scrollbar">
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm ${
                                m.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none italic'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-3xl shadow-sm flex gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 flex gap-2 mt-4 items-center">
                    <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiConversation()}
                        placeholder="כתוב ל-AI של ח. סבן..." 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-right px-4"
                    />
                    <button 
                        onClick={handleAiConversation}
                        className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all"
                    >
                        <Send size={20}/>
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* --- Bottom Nav --- */}
      <nav className="fixed bottom-8 left-8 right-8 z-[150]">
        <div className="bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[3rem] p-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex justify-around items-center px-12">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all border-none bg-transparent ${activeTab === 'home' ? 'text-blue-600 scale-125' : 'text-slate-300'}`}>
            <LayoutGrid size={28} />
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center transition-all border-none bg-transparent ${activeTab === 'chat' ? 'text-blue-600 scale-125' : 'text-slate-300'}`}>
            <MessageSquare size={28} />
          </button>
        </div>
      </nav>
    </div>
  );
}
