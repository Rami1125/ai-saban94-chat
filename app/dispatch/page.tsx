"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, Trash2, X, Send, Clock, Warehouse, MapPin, Share2, UserCheck, 
  Recycle, Menu, Edit2, Calendar, RefreshCw, Brain, Loader2, Terminal, Activity,
  Users, CheckCircle2, Package, Layout, Bell, Phone, Hash, ChevronRight 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- הגדרות ליבה ---
const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const containerActions = ['הצבה', 'החלפה', 'הוצאה'];
const wasteWarehouses = ['שארק (30)', 'כראדי (32)', 'שי שרון (40)'];
const standardWarehouses = ['התלמיד (1)', 'החרש (4)'];

// סטטוסים חדשים
const orderStatuses = [
  { id: 'הזמנה התקבלה', color: 'bg-orange-500', icon: <Bell size={12}/> },
  { id: 'בהכנה', color: 'bg-blue-500', icon: <Package size={12}/> },
  { id: 'בדרך', color: 'bg-purple-500', icon: <Truck size={12}/> },
  { id: 'סופקה', color: 'bg-green-600', icon: <CheckCircle2 size={12}/> }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterOS() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dispatch' | 'customers'>('dispatch');
  
  // 🔥 AI Brain States
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [showAiMobile, setShowAiMobile] = useState(false);

  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד (1)',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    address: '',
    container_action: 'הצבה',
    status: 'הזמנה התקבלה'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    try {
      const { data: ord } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
      const { data: cust } = await supabase.from('saban_customers').select('*');
      const { data: reqs } = await supabase.from('saban_customer_requests').select('*').eq('status', 'pending');
      setOrders(ord || []);
      setCustomers(cust || []);
      setRequests(reqs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  // 🔥 פונקציית שיתוף דוח בוקר
  const shareMorningReport = () => {
    const openOrders = orders.filter(o => o.status !== 'סופקה');
    let reportText = `🌅 *דוח בוקר - ח. סבן חומרי בניין*\n---------------------------\n`;
    openOrders.forEach(o => {
      reportText += `📍 *${o.customer_name}* | ${o.scheduled_time} | ${o.status}\n`;
    });
    reportText += `\n---------------------------\n_סה"כ הזמנות פתוחות: ${openOrders.length}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  // 🔥 הפעלת המוח
  const handleAiCommand = async () => {
    if (!aiInput.trim() || isAiTyping) return;
    const userMsg = aiInput;
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      setAiReport(data);
      if (data.aiResponse) {
        setAiMessages(prev => [...prev, { role: 'ai', content: data.aiResponse }]);
        if (data.executionResult?.includes('✅')) fetchData();
      }
    } catch (e) { toast.error("נתק במוח"); } finally { setIsAiTyping(false); }
  };

  const generateWAMessage = (order: any) => {
    const emoji = order.driver_name === 'פינוי פסולת' ? '♻️' : '📦';
    return `${emoji} *סידור ח. סבן חומרי בניין*\n---------------------------\n👤 *לקוח:* ${order.customer_name}\n🆔 *מספר:* ${order.order_id_comax}\n🚛 *נהג:* ${order.driver_name}\n⏰ *שעה:* ${order.scheduled_time}\n🏭 *מחסן:* ${order.warehouse_source}\n---------------------------\n_נציג מעדכן: ${order.created_by}_`;
  };

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(form).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([form]);

    if (!error) {
      toast.success("נשמר!");
      setShowForm(false);
      setEditingOrder(null);
      fetchData();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63] italic text-2xl">ח. סבן - מסנכרן סידור...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center relative z-100">
        <div className="flex gap-2">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white/10 rounded-xl border-none text-white cursor-pointer"><Menu size={28}/></button>
          <button onClick={shareMorningReport} className="p-2 bg-green-500/30 rounded-xl border-none text-white cursor-pointer"><Share2 size={28}/></button>
          <button onClick={() => setShowAiMobile(true)} className="lg:hidden p-2 bg-blue-500/30 rounded-xl border-none text-white cursor-pointer"><Brain size={28}/></button>
        </div>
        <div className="text-center">
            <h1 className="text-xl font-black italic text-white uppercase leading-none">ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest italic">לוח סידור</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setActiveView(activeView === 'dispatch' ? 'customers' : 'dispatch')} className="bg-white/10 rounded-xl font-black h-10 border-none px-4 text-white">
                {activeView === 'dispatch' ? <Users size={20}/> : <Layout size={20}/>}
            </Button>
            <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-600 rounded-xl font-black h-10 px-4 shadow-lg text-white">חדש +</Button>
        </div>
      </div>

      {/* --- Dispatch View --- */}
      {activeView === 'dispatch' && (
        <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in">
            {drivers.map((driver) => (
            <div key={driver.id} className="space-y-6">
                <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                    <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                    <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {timeSlots.map(time => {
                        const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                        return (
                        <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }}
                            className="flex flex-col items-center gap-2 cursor-pointer">
                            <div className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                            {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Plus size={16} className="text-slate-300" />}
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{time}</span>
                        </div>
                        );
                    })}
                    </div>
                </Card>

                <div className="space-y-4">
                {orders.filter(o => o.driver_name === driver.name).map((order) => {
                    const statusObj = orderStatuses.find(s => s.id === order.status) || orderStatuses[0];
                    return (
                        <Card key={order.id} className="p-6 rounded-[2rem] bg-white shadow-lg border-none relative group border-r-8 border-r-[#0B2C63] hover:scale-[1.01] transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black italic">{order.scheduled_time}</div>
                                    <div className="text-right">
                                        <div className="font-black text-slate-800 text-xl">{order.customer_name}</div>
                                        <Badge className={`${statusObj.color} text-white border-none text-[9px] font-black px-2 mt-1 flex items-center gap-1`}>
                                            {statusObj.icon} {order.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(order))}`, '_blank')} className="p-2 bg-green-50 text-green-600 rounded-lg border-none cursor-pointer"><RefreshCw size={16}/></button>
                                    <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none cursor-pointer"><Edit2 size={16}/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-500">
                                <div className="flex items-center gap-2 truncate"><MapPin size={14} className="text-red-400"/> {order.address || 'לא צוינה כתובת'}</div>
                                <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                            </div>
                        </Card>
                    );
                })}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- Customers & Requests View --- */}
      {activeView === 'customers' && (
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-left">
              {requests.map(req => (
                  <Card key={req.id} className="p-8 rounded-[3rem] bg-white ring-4 ring-green-400 animate-pulse border-none shadow-2xl relative">
                      <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-green-500 text-white rounded-2xl shadow-lg"><Activity size={24}/></div>
                          <Badge className="bg-green-100 text-green-700 font-black italic">פנייה מהאפליקציה</Badge>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-1 italic tracking-tighter">
                          {customers.find(c => c.customer_id === req.customer_id)?.full_name || 'לקוח'}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {req.details?.address}</p>
                      
                      <div className="flex gap-2 mt-4">
                          <button onClick={() => { setForm({...form, customer_name: customers.find(c => c.customer_id === req.customer_id)?.full_name, customer_id: req.customer_id, address: req.details?.address, container_action: req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה', driver_name: 'פינוי פסולת'}); setShowForm(true); }} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs shadow-lg">אשר ופתח הזמנה</button>
                      </div>
                  </Card>
              ))}
              {customers.map(client => (
                  <Card key={client.id} className="p-6 rounded-[2.5rem] bg-white/70 border-none shadow-sm flex justify-between items-center group">
                      <div className="text-right">
                          <p className="font-black text-slate-800">{client.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">ID: {client.customer_id}</p>
                      </div>
                      <button className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all border-none"><ChevronRight size={18}/></button>
                  </Card>
              ))}
          </div>
      )}

      {/* 🔥 Saban AI Brain Control - Desktop */}
      <div className="hidden lg:block max-w-[1800px] mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 bg-[#0B2C63] rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center gap-6 mb-4">
              <div className="bg-blue-500 p-4 rounded-[1.5rem] shadow-lg shadow-blue-500/30"><Brain size={32} className="text-white" /></div>
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase italic">Saban AI Brain</h2>
                <p className="text-blue-300 text-sm font-bold uppercase tracking-widest italic leading-none">Command Terminal</p>
              </div>
            </div>
            <div className="flex gap-4">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiCommand()} placeholder="ראמי, מה הפקודה?" className="flex-1 h-16 bg-white/10 border-none rounded-2xl px-6 text-white font-bold outline-none text-right placeholder:text-blue-400" />
              <button onClick={handleAiCommand} className="w-20 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl flex items-center justify-center border-none cursor-pointer">{isAiTyping ? <Loader2 className="animate-spin" /> : <Send />}</button>
            </div>
            {aiReport?.shareLink && (
              <Button onClick={() => window.open(aiReport.shareLink, '_blank')} className="mt-4 w-full bg-green-600 rounded-2xl font-black h-12 border-none text-white shadow-xl flex gap-2 justify-center italic"><Share2 size={20}/> שלח סידור לקבוצה</Button>
            )}
          </Card>
          <Card className="bg-slate-900 rounded-[3rem] p-8 text-white">
            <div className="flex items-center gap-2 mb-4 text-green-400"><Terminal size={20}/><span className="text-[10px] font-black uppercase">Logs</span></div>
            <div className="text-[11px] font-black text-blue-400 italic h-40 overflow-y-auto no-scrollbar leading-tight">
                {aiReport?.executionResult || "> System Ready. Awaiting signal..."}
            </div>
          </Card>
        </div>
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-6 shadow-2xl border-none text-right overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63] italic underline decoration-blue-200 underline-offset-8 uppercase">{editingOrder ? 'עריכת משימה' : 'הזמנה חדשה'}</h2>
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black transition-all"><X size={24}/></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold text-right outline-none" />
                <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold bg-white text-right outline-none">
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 font-black text-lg text-right outline-none focus:border-blue-600" />
            <input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 font-black text-lg text-right outline-none focus:border-blue-600" />
            
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 italic">סטטוס נוכחי</label>
                <div className="grid grid-cols-4 gap-2">
                    {orderStatuses.map(s => (
                        <button key={s.id} onClick={() => setForm({...form, status: s.id})} className={`py-3 rounded-xl text-[9px] font-black border-none transition-all ${form.status === s.id ? `${s.color} text-white shadow-lg` : 'bg-slate-50 text-slate-400'}`}>{s.id}</button>
                    ))}
                </div>
            </div>

            <Button onClick={saveOrder} className="w-full h-20 bg-green-600 hover:bg-green-500 text-white rounded-[2.5rem] font-black text-xl shadow-2xl border-none cursor-pointer">שמור ושלח ווטסאפ 🚀</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
