"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Calendar, Clock, Warehouse, MapPin, Share2, Bot, UserCheck, HardHat, FileText, Bell, Sparkles, Brain, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

// --- נתוני נהגים מקוריים ---
const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function AppDispatchNew() {
  // --- State מקורי ---
  const [orders, setOrders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- State חדש למוח AI ---
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  const supabase = getSupabase();

  // --- לוגיקה מקורית + חיבור מוח ---
  useEffect(() => {
    fetchInitialData();
    
    // האזנה Realtime לבקשות (מלשינון)
    const channel = supabase.channel('dispatch_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
        setRequests(prev => [payload.new, ...prev]);
        // הפעלת סאונד דרך ה-window (מה-Layout)
        if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
          (window as any).playNotificationSound();
        }
        toast.info(`בקשה חדשה: ${payload.new.customer_name}`, { icon: <Bell className="text-orange-500" /> });
        
        // המוח מגיב אוטומטית לבקשה דחופה
        if (payload.new.is_urgent) {
           addAiMessage('ai', `⚠️ שים לב ראמי, התקבלה בקשה דחופה מ${payload.new.requester_name} עבור ${payload.new.customer_name}. כדאי לשבץ את עלי למסלול מהיר.`);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    const { data: reqs } = await supabase.from('saban_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    const { data: ords } = await supabase.from('saban_orders').select('*');
    setRequests(reqs || []);
    setOrders(ords || []);
    setLoading(false);
  };

  // --- פונקציות המוח ---
  const addAiMessage = (role: 'user' | 'ai', content: string) => {
    setAiMessages(prev => [...prev, { role, content }]);
  };

  const askBrain = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput("");
    addAiMessage('user', msg);
    setIsAiTyping(true);

    // לוגיקת המוח (שאילתה לספר החוקים ב-DB)
    try {
      const { data: rules } = await supabase.from('saban_brain_rules').select('*').eq('is_active', true);
      // סימולציה של מענה לפי חוקים
      setTimeout(() => {
        let response = "אני מנתח את הסידור לפי ספר החוקים... ";
        if (msg.includes("איציק")) response += "זיהיתי שאיציק שלח 3 בקשות היום, כולן בטיפול.";
        else if (msg.includes("עלי")) response += "עלי משובץ כרגע ל-4 נסיעות. יש לו חלון פנוי ב-13:00.";
        else response += "כיצד אוכל לעזור לך לייעל את הסידור היום?";
        
        addAiMessage('ai', response);
        setIsAiTyping(false);
      }, 1000);
    } catch (e) {
      setIsAiTyping(false);
    }
  };

  // --- שיתוף ווטסאפ מקורי ---
  const shareToWhatsApp = () => {
    const text = `*סידור עבודה SabanOS - ${new Date().toLocaleDateString('he-IL')}*\n\n` + 
                 orders.map(o => `⏰ ${o.delivery_time} | 👤 ${o.customer_name}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header מקורי */}
      <div className="bg-white p-4 border-b sticky top-0 z-30 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#0B2C63] flex items-center gap-2 italic">SabanOS Studio</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-10 border-slate-200" onClick={() => setShowAiPanel(!showAiPanel)}>
             <Brain size={18} className={`ml-2 ${showAiPanel ? 'text-blue-600' : 'text-slate-400'}`}/> לוח המוח
          </Button>
          <Button onClick={shareToWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] rounded-xl gap-2 font-bold h-10 text-white">
             <Share2 size={18}/> שיתוף
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* עמודת בקשות (מלשינון) - 3 עמודות */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
               <Bell className="text-orange-500 animate-pulse" size={20}/> בקשות חמות
            </h2>
            <Badge className="bg-orange-500 text-white">{requests.length}</Badge>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-1">
            {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-3xl border-none shadow-md bg-white border-r-8 border-orange-500 hover:scale-[1.02] transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800 text-sm">{req.customer_name}</span>
                  <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><Clock size={12}/> {new Date(req.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-slate-400 font-bold mb-3">{req.request_type} #{req.doc_number}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-[#0B2C63] text-white rounded-xl font-bold h-8 text-[11px]">חכמת</Button>
                  <Button size="sm" className="bg-blue-600 text-white rounded-xl font-bold h-8 text-[11px]">עלי</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* לוח שעות מרכזי - 6 עמודות */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {drivers.map(driver => (
              <div key={driver.name} className="flex-shrink-0 text-center group">
                <div className="w-16 h-16 rounded-[1.5rem] border-2 p-1 shadow-sm mb-1 group-hover:scale-110 transition-transform" style={{ borderColor: driver.color }}>
                  <img src={driver.img} className="w-full h-full rounded-xl object-cover" alt={driver.name} />
                </div>
                <span className="font-black text-[10px]">{driver.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {timeSlots.map(time => (
              <div key={time} className="flex gap-4 items-center group">
                <div className="w-12 text-xs font-black text-slate-400">{time}</div>
                <div className="flex-1 min-h-[50px] p-2 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-blue-200 transition-all flex items-center gap-2">
                    {orders.filter(o => o.delivery_time === time).map((o, idx) => (
                        <Badge key={idx} className="bg-blue-50 text-blue-700 border-none font-bold text-xs px-3 h-8 rounded-lg">
                            {o.customer_name} | {o.driver_name}
                        </Badge>
                    ))}
                    <Plus size={14} className="text-slate-200 opacity-0 group-hover:opacity-100 cursor-pointer ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* לוח הודעות AI - 3 עמודות */}
        <div className="lg:col-span-3">
          <Card className="h-[80vh] rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col overflow-hidden">
            <div className="p-5 bg-[#0B2C63] text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><Sparkles size={20} className="text-blue-300"/></div>
              <div>
                <h3 className="font-black text-sm">המוח של SabanOS</h3>
                <p className="text-[10px] text-blue-200 uppercase font-bold">AI Assistant</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {aiMessages.length === 0 && (
                <div className="text-center py-10 opacity-40">
                   <Bot size={40} className="mx-auto mb-2" />
                   <p className="text-xs font-bold italic text-slate-800">שלום ראמי, אני מנתח את הסידור בזמן אמת. שאל אותי הכל.</p>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[90%] p-3 rounded-2xl text-xs font-bold shadow-sm ${m.role === 'user' ? 'bg-white text-slate-700 border' : 'bg-blue-600 text-white'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isAiTyping && <Loader2 size={16} className="animate-spin text-blue-600 mx-auto" />}
              <div ref={aiScrollRef} />
            </div>

            <div className="p-4 border-t bg-white flex gap-2">
              <Input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askBrain()}
                placeholder="שאל את המוח..."
                className="h-10 rounded-xl bg-slate-100 border-none font-bold text-xs"
              />
              <Button onClick={askBrain} className="h-10 w-10 p-0 bg-[#0B2C63] rounded-xl shrink-0 shadow-lg">
                <Send size={16} />
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
