"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { SabanBrain } from "@/lib/saban-brain";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Plus, Send, Clock, Share2, Bell, Sparkles, Brain, 
  Loader2, Bot, MessageSquare, FileText, AlertCircle, Wifi, WifiOff 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// נתוני נהגים
const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanDispatchAI() {
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');
  
  const supabase = getSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- גילוי הנתק וחיבור Realtime ---
  useEffect(() => {
    fetchInitialData();
    
    // בדיקה אם טבלת ה-Realtime מאופשרת ב-Supabase
    const channel = supabase.channel('realtime_dispatch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, payload => {
        console.log("Realtime Update:", payload);
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new, ...prev]);
          toast.success(`בקשה חדשה מ: ${payload.new.customer_name}`);
          // חוק מלשינון אוטומטי
          if (payload.new.is_urgent) {
            setAiMessages(prev => [...prev, { role: 'ai', content: `🚨 מלשינון: נכנסה הזמנה דחופה ל${payload.new.customer_name}! לשבץ את עלי עכשיו?` }]);
          }
        }
        fetchInitialData(); // ריענון נתונים כללי
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setDbStatus('connected');
        else setDbStatus('error');
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const fetchInitialData = async () => {
    try {
      const { data: ords, error: e1 } = await supabase.from('saban_orders').select('*');
      const { data: reqs, error: e2 } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
      if (e1 || e2) throw new Error("נתק בטבלאות");
      setOrders(ords || []);
      setRequests(reqs || []);
      setDbStatus('connected');
    } catch (e) {
      setDbStatus('error');
      console.error("Fetch error:", e);
    }
  };

  const askBrain = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsAiTyping(true);

    try {
      // שימוש במוח המעודכן עם הרוטציה
      const response = await SabanBrain.ask(msg);
      setAiMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', content: "⚠️ אחי, יש נתק מול גוגל. בדוק את ה-KEY_POOL ב-Vercel." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header עם נורת סטטוס לגילוי נתק */}
      <div className="bg-white p-4 border-b sticky top-0 z-30 shadow-sm flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#0B2C63] p-2 rounded-xl text-white shadow-lg"><Truck size={28}/></div>
          <div>
            <h1 className="text-2xl font-black text-[#0B2C63] italic uppercase flex items-center gap-2">
              SabanOS Dispatch 
              {dbStatus === 'connected' ? <Wifi className="text-green-500" size={16}/> : <WifiOff className="text-red-500 animate-pulse" size={16}/>}
            </h1>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-bold">
           <Badge className={dbStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {dbStatus === 'connected' ? 'מחובר לסידור' : 'נתק בנתונים'}
           </Badge>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* עמודה 1: מלשינון בקשות */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
               <Bell className="text-orange-500" size={20}/> מלשינון בקשות
            </h2>
            <Badge className="bg-orange-500 text-white rounded-full h-6 w-6 flex items-center justify-center">{requests.length}</Badge>
          </div>
          <div className="space-y-3 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {requests.map(req => (
              <Card key={req.id} className={`p-4 rounded-[2rem] border-none shadow-md bg-white border-r-8 transition-all hover:scale-105 ${req.is_urgent ? 'border-red-500' : 'border-orange-500'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-black text-slate-800">{req.customer_name}</span>
                  {req.is_urgent && <Badge className="bg-red-500 text-[8px] animate-bounce">דחוף</Badge>}
                </div>
                <div className="text-[11px] text-slate-400 font-bold mb-4">#{req.doc_number} • {req.request_type}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-[#0B2C63] text-white rounded-xl font-bold h-8 text-[10px]">חכמת</Button>
                  <Button size="sm" className="bg-blue-600 text-white rounded-xl font-bold h-8 text-[10px]">עלי</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* עמודה 2: לוח השעות (הסידור) */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-[3rem] shadow-xl border-none">
            {timeSlots.map(time => (
              <div key={time} className="flex gap-6 items-center group border-b border-slate-50 last:border-none py-2">
                <div className="w-14 text-sm font-black text-[#0B2C63]">{time}</div>
                <div className="flex-1 min-h-[55px] p-2 bg-slate-50/30 rounded-2xl border-2 border-transparent group-hover:border-blue-100 flex items-center gap-3 relative">
                    {orders.filter(o => o.delivery_time === time).map((o, idx) => (
                        <Badge key={idx} className={`border-none font-bold text-xs px-4 h-9 rounded-xl shadow-sm transition-colors ${o.status === 'pending' ? 'bg-orange-500' : 'bg-green-600'}`}>
                            {o.customer_name} | {o.driver_name}
                        </Badge>
                    ))}
                    <Plus size={18} className="absolute left-4 opacity-0 group-hover:opacity-100 text-blue-300 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* עמודה 3: לוח הודעות AI וספר חוקים */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="h-[80vh] rounded-[2.5rem] border-none shadow-2xl bg-[#0B2C63] flex flex-col overflow-hidden border-4 border-white">
            <div className="p-6 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl"><Sparkles size={20} className="text-yellow-300"/></div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">המוח המבצעי</h3>
                  <p className="text-[10px] text-blue-300 font-bold">סנכרון חוקים און-ליין</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/5 scrollbar-hide">
              {aiMessages.length === 0 && (
                <div className="text-center py-10 opacity-30 text-white">
                   <Bot size={40} className="mx-auto mb-2" />
                   <p className="text-[10px] font-bold">ממתין לפקודה שלך, ראמי...</p>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[11px] font-bold shadow-lg ${
                    m.role === 'user' ? 'bg-white text-[#0B2C63]' : 'bg-blue-600 text-white border border-blue-400'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isAiTyping && <div className="text-white/40 text-[9px] font-black animate-pulse px-4 italic text-center italic">המוח ברוטציית מפתחות...</div>}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-white/10 flex gap-2 border-t border-white/10">
              <Input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askBrain()}
                placeholder="פקודה למוח..."
                className="h-10 rounded-xl bg-white/10 border-none text-white font-bold placeholder:text-white/20 text-xs"
              />
              <Button onClick={askBrain} className="h-10 w-10 p-0 bg-blue-500 rounded-xl shrink-0">
                <Send size={16} />
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
