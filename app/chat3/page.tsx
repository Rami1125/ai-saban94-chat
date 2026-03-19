"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Plus, Trash2, Send, Clock, Share2, Bell, Sparkles, Brain, Loader2, Bot, MessageSquare, FileText
} from "lucide-react";
import { toast, Toaster } from "sonner";

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
  
  const supabase = getSupabase();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
    const channel = supabase.channel('realtime_dispatch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
        setRequests(prev => [payload.new, ...prev]);
        (window as any).playNotificationSound?.();
        toast.info("בקשה חדשה הגיעה ללוח");
        
        // המוח מגיב אוטומטית לפי חוק דחיפות
        if (payload.new.notes?.includes("דחוף")) {
          setAiMessages(prev => [...prev, { role: 'ai', content: `⚠️ זיהיתי בקשה דחופה ל${payload.new.customer_name}. ממליץ לשבץ את עלי לביצוע מיידי.` }]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const fetchInitialData = async () => {
    const { data: ords } = await supabase.from('saban_orders').select('*');
    const { data: reqs } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
    setOrders(ords || []);
    setRequests(reqs || []);
  };

  const askBrain = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsAiTyping(true);

    // סימולציה של מענה המוח לפי ספר החוקים
    setTimeout(() => {
      let response = "מנתח נתונים מהסידור... ";
      if (msg.includes("דוח בוקר")) {
        response = `📝 דוח בוקר מוכן לשיתוף:\n- סה"כ ${orders.length} הובלות.\n- עלי: ${orders.filter(o=>o.driver_name==='עלי').length} נסיעות.\n- חכמת: ${orders.filter(o=>o.driver_name==='חכמת').length} נסיעות.`;
      } else if (msg.includes("תזיז")) {
        response = "הבנתי, עדכנתי את שעת האספקה בלוח השעות. הסידור סונכרן. ✅";
      } else {
        response = "קיבלתי את הבקשה, פועל לפי ספר החוקים של ח.סבן לייעול הסידור.";
      }
      setAiMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsAiTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header קבוע */}
      <div className="bg-white p-4 border-b sticky top-0 z-30 shadow-sm flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#0B2C63] p-2 rounded-xl text-white shadow-lg"><Truck size={28}/></div>
          <h1 className="text-2xl font-black text-[#0B2C63] italic uppercase">SabanOS Dispatch</h1>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl font-bold h-11 border-slate-200"><FileText size={18} className="ml-2"/> דוח בוקר</Button>
           <Button className="bg-[#25D366] hover:bg-[#128C7E] rounded-xl font-bold h-11 text-white shadow-md"><Share2 size={18} className="ml-2"/> שיתוף</Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* עמודה 1: לוח בקשות איציק (מלשינון) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
               <Bell className="text-orange-500 animate-pulse" size={20}/> בקשות חמות
            </h2>
            <Badge className="bg-orange-500 text-white rounded-full h-6 w-6 flex items-center justify-center p-0">{requests.length}</Badge>
          </div>
          <div className="space-y-3 h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-[2rem] border-none shadow-md bg-white border-r-8 border-orange-500 hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800 text-sm">{req.customer_name}</span>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{new Date(req.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-bold mb-4 uppercase">#{req.doc_number} • {req.request_type}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-[#0B2C63] text-white rounded-xl font-bold h-9 text-[11px]">שייך לחכמת</Button>
                  <Button size="sm" className="bg-blue-600 text-white rounded-xl font-bold h-9 text-[11px]">שייך לעלי</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* עמודה 2: לוח שעות וסידור נהגים */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-50">
            {drivers.map(driver => (
              <div key={driver.name} className="flex-shrink-0 text-center group cursor-pointer">
                <div className="w-20 h-20 rounded-[2rem] border-4 p-1 shadow-md transition-all group-hover:scale-110" style={{ borderColor: driver.color }}>
                  <img src={driver.img} className="w-full h-full rounded-[1.5rem] object-cover" alt={driver.name} />
                </div>
                <span className="font-black text-xs mt-2 block text-slate-700">{driver.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 bg-white p-6 rounded-[3rem] shadow-xl border-none">
            {timeSlots.map(time => (
              <div key={time} className="flex gap-6 items-center group border-b border-slate-50 last:border-none py-2">
                <div className="w-14 text-sm font-black text-[#0B2C63]">{time}</div>
                <div className="flex-1 min-h-[50px] p-2 bg-slate-50/30 rounded-2xl border-2 border-transparent group-hover:border-blue-100 transition-all flex items-center gap-3">
                    {orders.filter(o => o.delivery_time === time).map((o, idx) => (
                        <Badge key={idx} className="bg-blue-600 text-white border-none font-bold text-xs px-4 h-9 rounded-xl shadow-sm">
                            {o.customer_name} | {o.driver_name}
                        </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 rounded-full bg-white shadow-sm border h-8 w-8 p-0 text-blue-600 mr-auto">
                        <Plus size={18} />
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* עמודה 3: לוח הודעות AI וספר חוקים */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="h-[82vh] rounded-[2.5rem] border-none shadow-2xl bg-[#0B2C63] flex flex-col overflow-hidden">
            <div className="p-6 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl"><Brain size={24} className="text-blue-300"/></div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">המוח של SabanOS</h3>
                  <p className="text-[10px] text-blue-300 font-bold">פעיל לפי ספר החוקים 24/7</p>
                </div>
              </div>
              <Sparkles size={20} className="text-yellow-400 animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/5">
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-xs font-bold shadow-lg ${
                    m.role === 'user' ? 'bg-white text-[#0B2C63] rounded-tr-none' : 'bg-blue-500 text-white rounded-tl-none border border-blue-400'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isAiTyping && <div className="text-white/50 text-[10px] font-black animate-pulse px-4">המוח מעבד פקודה...</div>}
              <div ref={scrollRef} />
            </div>

            <div className="p-5 bg-white/10 border-t border-white/10 flex gap-2">
              <Input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askBrain()}
                placeholder="פקודה לסידור..."
                className="h-12 rounded-2xl bg-white/10 border-none text-white font-bold placeholder:text-white/30 text-sm focus:ring-2 ring-blue-400"
              />
              <Button onClick={askBrain} className="h-12 w-12 p-0 bg-blue-500 hover:bg-blue-600 rounded-2xl shrink-0 shadow-lg transition-transform active:scale-90">
                <Send size={20} className="text-white" />
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
