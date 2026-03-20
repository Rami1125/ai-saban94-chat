"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Trash2, X, Send, Clock, MapPin, Share2, Menu, Edit2, Brain, Loader2, Terminal } from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', type: 'מנוף 🏗️' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', type: 'משאית 🚛' },
  { name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', type: 'מכולה ♻️' }
];

export default function SabanOS() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAiMobile, setShowAiMobile] = useState(false);
  
  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const handleAi = async () => {
    if (!aiInput.trim()) return;
    setIsAiTyping(true);
    const res = await fetch('/api/admin_pro/brain', { method: 'POST', body: JSON.stringify({ query: aiInput }) });
    const data = await res.json();
    setAiReport(data);
    setAiInput("");
    setIsAiTyping(false);
    if (data.executionResult?.includes('✅')) fetchData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#0B2C63] animate-pulse">SABAN OS SYNCING...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] flex justify-between items-center shadow-xl">
        <button onClick={() => setShowAiMobile(true)} className="lg:hidden p-3 bg-white/10 rounded-xl border-none text-white"><Brain size={24}/></button>
        <div className="text-center"><h1 className="text-xl font-black italic uppercase">ח.סבן</h1><p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Master Dispatch</p></div>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">S</div>
      </header>

      {/* Grid */}
      <main className="max-w-[1800px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {drivers.map(d => (
          <div key={d.name} className="space-y-4">
            <Card className="p-4 rounded-[2rem] bg-white border-none shadow-md flex items-center gap-4">
              <img src={d.img} className="w-12 h-12 rounded-xl object-cover" />
              <div><h2 className="font-black text-slate-800">{d.name}</h2><Badge className="bg-slate-50 text-slate-400 border-none text-[9px]">{d.type}</Badge></div>
            </Card>
            {orders.filter(o => o.driver_name === d.name).map(o => (
              <Card key={o.id} className="p-5 rounded-[2rem] border-none shadow-lg bg-white border-r-8 border-r-[#0B2C63]">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="bg-[#0B2C63] text-white p-2 rounded-lg text-xs font-black">{o.scheduled_time}</div>
                    <div><div className="font-black text-slate-800">{o.customer_name}</div><div className="text-[10px] text-blue-500 font-bold italic">{o.status}</div></div>
                  </div>
                  <button onClick={() => { if(confirm('למחוק?')) supabase.from('saban_master_dispatch').delete().eq('id', o.id).then(fetchData); }} className="text-red-300 border-none bg-transparent cursor-pointer"><Trash2 size={16}/></button>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </main>

      {/* AI Control Center (Desktop) */}
      <div className="hidden lg:grid max-w-[1800px] mx-auto px-4 grid-cols-3 gap-6 mt-8">
        <Card className="col-span-2 bg-[#0B2C63] rounded-[3rem] p-8 text-white relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6"><Brain className="text-blue-400" size={32}/><div><h3 className="font-black italic uppercase">Saban AI Brain</h3><p className="text-xs text-blue-300">ניהול סידור בשפה חופשית</p></div></div>
          <div className="flex gap-4">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAi()} placeholder="ראמי, מה הפקודה?" className="flex-1 h-14 bg-white/10 border-none rounded-2xl px-6 text-white font-bold outline-none text-right" />
            <Button onClick={handleAi} className="bg-blue-500 h-14 w-20 rounded-2xl border-none">{isAiTyping ? <Loader2 className="animate-spin"/> : <Send/>}</Button>
          </div>
          {aiReport?.shareLink && (
            <Button onClick={() => window.open(aiReport.shareLink, '_blank')} className="mt-4 w-full bg-green-600 rounded-2xl font-black gap-2 border-none h-12"><Share2 size={18}/> שלח לקבוצת הווטסאפ</Button>
          )}
        </Card>
        <Card className="bg-slate-900 rounded-[3rem] p-8 text-white">
          <div className="flex items-center gap-2 mb-4 text-green-400"><Terminal size={20}/> <span className="text-xs font-black uppercase">Inspector</span></div>
          <div className="text-xs space-y-3 font-mono">
            <div className="flex justify-between"><span className="text-slate-500">STATUS:</span> <span className="text-green-400">ONLINE</span></div>
            <div className="flex justify-between"><span className="text-slate-500">SQL EXEC:</span> <span className="text-blue-400 truncate max-w-[150px]">{aiReport?.executionResult || "IDLE"}</span></div>
          </div>
        </Card>
      </div>

      {/* AI Mobile Drawer */}
      {showAiMobile && (
        <div className="fixed inset-0 bg-[#0B2C63] z-[100] p-6 flex flex-col animate-in slide-in-from-bottom">
          <div className="flex justify-between items-center mb-8"><h2 className="text-white font-black italic">SABAN AI</h2><button onClick={() => setShowAiMobile(false)} className="bg-white/10 p-2 rounded-full border-none text-white"><X/></button></div>
          <div className="flex-1 bg-black/20 rounded-[2rem] p-6 text-white font-bold text-sm italic">{aiReport?.aiResponse || "ממתין לפקודה..."}</div>
          <div className="mt-6 flex gap-2">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} className="flex-1 bg-white/10 rounded-xl p-4 text-white border-none text-right" />
            <button onClick={handleAi} className="bg-blue-600 p-4 rounded-xl border-none text-white"><Send/></button>
          </div>
          {aiReport?.shareLink && <Button onClick={() => window.open(aiReport.shareLink, '_blank')} className="mt-4 bg-green-600 rounded-xl h-14 border-none text-white font-black">שלח לוואטסאפ</Button>}
        </div>
      )}
    </div>
  );
}
