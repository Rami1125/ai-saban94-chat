"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Users, Bell, CheckCircle2, XCircle, Clock, 
  ExternalLink, MessageSquare, Activity, Map, 
  ChevronLeft, Star, Phone, MoreHorizontal, Zap
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanAirDashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchData = async () => {
    const { data: clients } = await supabase.from('saban_customers').select('*');
    const { data: reqs } = await supabase.from('saban_customer_requests').select('*').eq('status', 'pending');
    const { data: orders } = await supabase.from('saban_master_dispatch').select('*').neq('status', 'הושלם');
    
    setCustomers(clients || []);
    setRequests(reqs || []);
    setLiveOrders(orders || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('air_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, () => {
        new Audio('/sounds/notify.mp3').play().catch(() => {});
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const approveRequest = async (req: any) => {
    // 1. עדכון סטטוס הבקשה
    await supabase.from('saban_customer_requests').update({ status: 'approved' }).eq('id', req.id);
    
    // 2. יצירת שורה חדשה בסידור (שכפול נתונים מהבקשה)
    const { error } = await supabase.from('saban_master_dispatch').insert([{
        customer_id: req.customer_id,
        container_action: req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה',
        status: 'אושר להפצה',
        address: req.details?.address || 'עודכן מהאפליקציה'
    }]);

    if (!error) {
        toast.success("הבקשה אושרה ושובצה בסידור!");
        fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 font-sans p-6 lg:p-10 text-right" dir="rtl">
      <Toaster position="top-left" richColors />

      {/* --- חלק 1: לוח מחוונים עליון (Stats & Dispatch) --- */}
      <section className="max-w-7xl mx-auto mb-12">
        <header className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 ring-8 ring-white">
                    <Zap size={30} fill="currentColor"/>
                </div>
                <div>
                    <h1 className="text-4xl font-black italic text-slate-800 tracking-tighter">SabanOS Air</h1>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Real-time Control Center</p>
                </div>
            </div>
            <div className="flex gap-3">
                <Card className="bg-white border-none px-6 py-3 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-black italic">סידור פעיל: {liveOrders.length}</span>
                </Card>
            </div>
        </header>

        {/* טבלת סידור מהירה (Quick View) */}
        <Card className="bg-white/70 backdrop-blur-md border-none rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black italic flex items-center gap-2"><Truck size={20}/> לוח הפצה נוכחי</h2>
                <button className="text-xs font-bold text-blue-600 underline">לניהול סידור מלא</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {liveOrders.slice(0, 4).map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex flex-col gap-2">
                        <Badge className="w-fit bg-blue-50 text-blue-600 border-none text-[9px]">{order.status}</Badge>
                        <p className="font-black text-xs italic">{order.customer_name || "לקוח כללי"}</p>
                        <p className="text-[10px] text-slate-400 font-bold"><Map size={10} className="inline ml-1"/>{order.address}</p>
                    </div>
                ))}
            </div>
        </Card>
      </section>

      <hr className="max-w-7xl mx-auto border-slate-200 mb-12 opacity-50" />

      {/* --- חלק 2: ניהול לקוחות ופניות (The Radar) --- */}
      <section className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white rounded-xl shadow-sm"><Users size={24} className="text-blue-600"/></div>
            <h2 className="text-2xl font-black italic text-slate-800">ניטור לקוחות ופעולות LIVE</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customers.map(client => {
                const clientReq = requests.find(r => r.customer_id === client.customer_id);
                return (
                    <Card key={client.id} className={`group relative p-8 rounded-[3rem] border-none shadow-[0_10px_40px_rgba(0,0,0,0.02)] transition-all duration-700 ${clientReq ? 'bg-white ring-[6px] ring-green-400/30 shadow-2xl' : 'bg-white/60'}`}>
                        {/* אפקט הבהוב ללקוח פונה */}
                        {clientReq && (
                            <div className="absolute top-0 right-0 left-0 h-2 bg-green-500 animate-pulse"></div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-[1.5rem] transition-all ${clientReq ? 'bg-green-500 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>
                                <Activity size={28} className={clientReq ? 'animate-spin-slow' : ''}/>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Badge className={`border-none font-black italic ${clientReq ? 'bg-green-100 text-green-700 animate-bounce' : 'bg-slate-100 text-slate-400'}`}>
                                    {clientReq ? 'פנייה ממתינה!' : 'מחובר'}
                                </Badge>
                                <span className="text-[9px] font-bold text-slate-300">ID: {client.customer_id}</span>
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 mb-2 italic tracking-tight">{client.full_name}</h3>
                        <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-1"><Map size={12}/> {client.address}</p>

                        {clientReq ? (
                            <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 space-y-4 animate-in zoom-in duration-300">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase text-green-600">בקשת לקוח:</p>
                                    <Badge className="bg-green-600 text-white border-none">{clientReq.action_type}</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => approveRequest(clientReq)} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs shadow-lg shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
                                        <CheckCircle2 size={16}/> אשר ושבץ
                                    </button>
                                    <button className="p-4 bg-white text-red-500 rounded-2xl border border-red-50 hover:bg-red-50 transition-all">
                                        <XCircle size={18}/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group">
                                    <History size={18} className="text-slate-300 group-hover:text-white"/>
                                    <span className="text-[9px] font-black uppercase">היסטוריה</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 bg-slate-50 p-4 rounded-2xl hover:bg-slate-800 hover:text-white transition-all group">
                                    <Phone size={18} className="text-slate-300 group-hover:text-white"/>
                                    <span className="text-[9px] font-black uppercase">צור קשר</span>
                                </button>
                            </div>
                        )}
                        
                        <button className="w-full mt-4 py-2 text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 transition-all">
                            לפתיחת תיק לקוח מלא <ChevronLeft size={10} className="inline mr-1"/>
                        </button>
                    </Card>
                );
            })}
        </div>
      </section>
    </div>
  );
}
