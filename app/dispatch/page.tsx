"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Menu, Edit2, Calendar, RefreshCw, CheckCircle2,
  Brain, Loader2, Users, Activity, Phone, ChevronRight, MessageSquare
} from "lucide-react";
import { toast, Toaster } from "sonner";

const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

const statusOptions = [
  { label: 'פתוח', value: 'פתוח', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'אושר להפצה', value: 'אושר להפצה', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { label: 'בביצוע', value: 'בביצוע', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { label: 'הושלם', value: 'הושלם', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { label: 'בוטל', value: 'בוטל', color: 'bg-red-100 text-red-700 border-red-200' }
];

const teamMembers = ['ראמי', 'יואב', 'איציק'];
const standardWarehouses = ['התלמיד (1)', 'החרש (4)'];
const wasteWarehouses = ['שארק (30)', 'כראדי (32)', 'שי שרון (40)'];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]); // ניהול לקוחות
  const [requests, setRequests] = useState<any[]>([]); // בקשות מהאפליקציה
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [view, setView] = useState<'dispatch' | 'customers'>('dispatch'); // בורר תצוגה
  
  // 🔥 סנכרון AI Brain
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);

  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד (1)',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    address: '',
    container_action: 'הובלה',
    status: 'פתוח'
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
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleAiCommand = async () => {
    if (!aiInput.trim() || isTyping) return;
    const userMsg = aiInput;
    setAiInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const data = await res.json();
      if (data.answer) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
        if (data.answer.includes("✅")) fetchData(); 
      }
    } catch (e) { toast.error("נתק מול המוח"); } finally { setIsTyping(false); }
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");
    const payload = { ...form, start_process_time: new Date().toISOString() };
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success("נשמר בסידור!");
      setShowForm(false);
      setEditingOrder(null);
      setForm({ ...form, customer_name: '', order_id_comax: '', address: '', status: 'פתוח' });
      fetchData();
    }
  };

  const shareMorningReport = () => {
    const report = `☀️ *דוח סידור ח. סבן - ${new Date().toLocaleDateString('he-IL')}*\n` +
      orders.map(o => `• ${o.scheduled_time} | ${o.customer_name} | ${o.status}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, '_blank');
  };

  const getStatusStyle = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-slate-100 text-slate-700';
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63] italic text-2xl uppercase tracking-tighter">Syncing Saban OS...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center relative z-50">
        <div className="flex gap-2">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white/10 rounded-xl border-none text-white cursor-pointer hover:bg-white/20">
                {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
            </button>
            <button onClick={() => setView(view === 'dispatch' ? 'customers' : 'dispatch')} className="p-2 bg-blue-500/30 rounded-xl border-none text-white flex items-center gap-2 font-black text-xs px-4 italic">
                {view === 'dispatch' ? <Users size={20}/> : <LayoutGrid size={20}/>}
                <span className="hidden md:inline">{view === 'dispatch' ? 'ניהול לקוחות' : 'חזרה לסידור'}</span>
            </button>
        </div>
        <div className="text-center">
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase">ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none">Master OS Dispatch</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAiChat(!showAiChat)} className="bg-white/10 border-none rounded-xl text-white hover:bg-white/20">
            <Brain size={20} className={isTyping ? "animate-bounce" : ""} />
          </Button>
          <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-600 rounded-xl font-black h-10 px-4 border-none text-white shadow-lg hover:bg-blue-500 transition-all">+ חדש</Button>
        </div>
        
        {isMenuOpen && (
          <div className="absolute top-24 right-6 left-6 bg-white rounded-[2.5rem] shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
             <button onClick={shareMorningReport} className="w-full flex items-center gap-4 p-5 hover:bg-blue-50 rounded-2xl text-[#0B2C63] font-black border-none text-right transition-all">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Share2 size={22}/></div>
                <div>
                    <p className="text-sm italic">שלח דוח סידור בוקר</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp Group Sync</p>
                </div>
             </button>
          </div>
        )}
      </div>

      {/* תצוגה 1: לוח סידור (המקורי שלך) */}
      {view === 'dispatch' && (
        <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {drivers.map((driver) => (
            <div key={driver.id} className="space-y-6">
                <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6 text-right">
                        <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">{driver.name}</h2>
                            <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] uppercase tracking-widest italic">{driver.defaultType}</Badge>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {timeSlots.map(time => {
                        const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                        return (
                        <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setEditingOrder(null); setShowForm(true); }}
                               className="flex flex-col items-center gap-2 cursor-pointer min-w-[50px] group">
                            <div className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-lg scale-105' : 'bg-slate-50 border-slate-100 group-hover:border-blue-300'}`}>
                            {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Plus size={16} className="text-slate-300" />}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 italic">{time}</span>
                        </div>
                        );
                    })}
                    </div>
                </Card>

                <div className="space-y-4">
                {orders.filter(o => o.driver_name === driver.name).map((order) => (
                    <Card key={order.id} className="p-6 rounded-[2.5rem] bg-white shadow-lg border-none relative group border-r-8 border-r-[#0B2C63] hover:translate-x-[-4px] transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4 text-right">
                                <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black shadow-inner italic">{order.scheduled_time}</div>
                                <div>
                                    <div className="font-black text-slate-800 text-xl leading-tight">{order.customer_name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className={`border-none font-black text-[9px] uppercase px-2 py-0.5 ${getStatusStyle(order.status)}`}>{order.status}</Badge>
                                        <span className="text-slate-400 font-bold text-[10px]">#{order.order_id_comax}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none cursor-pointer hover:bg-blue-600 hover:text-white"><Edit2 size={16}/></button>
                                <button onClick={() => { if(confirm('למחוק הזמנה?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-lg border-none cursor-pointer hover:bg-red-500 hover:text-white"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-500 uppercase text-right">
                            <div className="flex items-center gap-2 truncate"><MapPin size={14} className="text-red-400"/> {order.address || 'איסוף עצמי'}</div>
                            <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                            <div className="flex items-center gap-2"><UserCheck size={14} className="text-orange-400"/> {order.created_by}</div>
                            {order.driver_name === 'פינוי פסולת' && <div className="flex items-center gap-2 text-green-600 italic"><Recycle size={14}/> {order.container_action}</div>}
                        </div>
                    </Card>
                ))}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* תצוגה 2: ניהול לקוחות ומלשינון (התוספת החדשה) */}
      {view === 'customers' && (
        <div className="max-w-[1400px] mx-auto px-6 animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 text-blue-700"><Users size={32}/></div>
                <div>
                    <h2 className="text-3xl font-black italic text-slate-800 leading-none">רדאר לקוחות & פניות</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 italic">Live Client Requests Radar</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* כרטיסי פנייה מהבהבים (המלשינון) */}
                {requests.map(req => (
                    <Card key={req.id} className="p-8 rounded-[3rem] bg-white ring-4 ring-green-400 animate-pulse border-none shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 text-right">
                            <div className="p-4 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100"><Activity size={24} className="animate-spin-slow"/></div>
                            <div className="text-left">
                                <Badge className="bg-green-100 text-green-700 border-none font-black italic mb-1">פנייה חיה מהאפליקציה</Badge>
                                <p className="text-[9px] font-bold text-slate-300 uppercase">ID: {req.customer_id}</p>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 italic">
                            {customers.find(c => c.customer_id === req.customer_id)?.full_name || 'לקוח מערכת'}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> {req.details?.address || 'כתובת מהנייד'}</p>
                        
                        <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 space-y-4">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase text-green-700 italic">
                                <span>פעולה מבוקשת:</span>
                                <Badge className="bg-green-600 text-white border-none">{req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה'}</Badge>
                            </div>
                            <button onClick={() => { setForm({...form, customer_name: customers.find(c => c.customer_id === req.customer_id)?.full_name, customer_id: req.customer_id, address: req.details?.address, container_action: req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה', driver_name: 'פינוי פסולת'}); setView('dispatch'); setShowForm(true); }} 
                                    className="w-full bg-green-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-green-200 flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95">
                                <CheckCircle2 size={18}/> אשר והעבר לסידור
                            </button>
                        </div>
                    </Card>
                ))}

                {/* כרטיסי לקוחות מחוברים */}
                {customers.map(client => (
                    <Card key={client.id} className="p-8 rounded-[3rem] bg-white/70 backdrop-blur-sm border-none shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all border-b-8 border-transparent hover:border-blue-600">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-slate-100 text-slate-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Users size={24}/></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        </div>
                        <div className="text-right">
                            <h3 className="font-black text-slate-800 text-2xl italic mb-1">{client.full_name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Active Portfolio</p>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl text-slate-500 text-[10px] font-black hover:bg-blue-50 transition-all">
                                    <Phone size={14}/> התקשר
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl text-slate-500 text-[10px] font-black hover:bg-blue-50 transition-all">
                                    <MessageSquare size={14}/> הודעה
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {/* 🔥 Saban Brain Chat UI (המקורי שלך) */}
      {showAiChat && (
        <div className="fixed bottom-24 left-6 right-6 z-[100] animate-in slide-in-from-bottom-8 duration-300">
          <Card className="bg-white/95 backdrop-blur-2xl border-2 border-blue-100 rounded-[3rem] shadow-2xl p-8 h-[450px] flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200 animate-pulse"><Brain size={24} /></div>
                <div>
                    <h3 className="font-black text-[#0B2C63] italic leading-none">SABAN BRAIN OS</h3>
                    <p className="text-[9px] font-bold text-blue-400 uppercase mt-1">Autonomous Dispatching</p>
                </div>
              </div>
              <button onClick={() => setShowAiChat(false)} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 p-2 no-scrollbar text-right">
              {messages.length === 0 && (
                <div className="text-center py-10">
                    <Loader2 className="mx-auto text-slate-200 mb-4 animate-spin" size={40}/>
                    <p className="text-slate-400 font-bold text-sm italic">ראמי, המוח מוכן לפקודה שלך...</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] font-bold text-sm shadow-sm transition-all ${m.role === 'user' ? 'bg-slate-100 text-slate-800 rounded-bl-none' : 'bg-[#0B2C63] text-white rounded-br-none italic'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-blue-50 text-blue-600 p-5 rounded-[2rem] rounded-br-none animate-pulse flex items-center gap-3 font-black italic">
                    <Loader2 size={18} className="animate-spin" /> המוח מעבד SQL...
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 bg-slate-50 p-3 rounded-[2rem] border-2 border-slate-100 focus-within:border-blue-400 transition-all">
              <input 
                value={aiInput} 
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiCommand()}
                placeholder="ראמי, מה הפקודה?"
                className="flex-1 bg-transparent border-none outline-none font-bold text-right px-4 placeholder:text-slate-300"
              />
              <button onClick={handleAiCommand} disabled={isTyping} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all border-none cursor-pointer shadow-lg shadow-blue-100">
                <Send size={22} />
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Form Overlay (המקורי שלך) */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-6 shadow-2xl border-none text-right overflow-y-auto max-h-[95vh] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#0B2C63] italic uppercase tracking-tighter underline decoration-blue-100 underline-offset-8">{editingOrder ? 'עריכת משימה' : 'הזמנה חדשה'}</h2>
              </div>
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black transition-all"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setForm({...form, created_by: m})}
                            className={`py-4 rounded-2xl text-[11px] font-black border-none transition-all cursor-pointer ${form.created_by === m ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-right px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic">תאריך</label>
                    <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold outline-none text-right focus:border-blue-400" />
                </div>
                <div className="space-y-1 text-right px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic">שעה</label>
                    <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold bg-white text-right focus:border-blue-400 appearance-none">
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-1 text-right px-1">
                <label className="text-[10px] font-black text-blue-600 uppercase italic">סטטוס הזמנה</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-blue-50 font-black text-right outline-none bg-white focus:border-blue-400 shadow-sm">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <div className="space-y-4">
                <input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full h-16 px-6 rounded-2xl border-2 border-slate-100 font-black text-xl text-right outline-none focus:border-blue-600 transition-all shadow-inner" />
                <input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-black text-lg text-right outline-none focus:border-blue-600" />
                <input placeholder="כתובת מלאה" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-bold text-right outline-none focus:border-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-right px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic">נהג אחראי</label>
                    <select value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold text-right outline-none bg-white">
                        {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1 text-right px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic">מחסן יציאה</label>
                    <select value={form.warehouse_source} onChange={e => setForm({...form, warehouse_source: e.target.value})} className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 font-bold text-right outline-none bg-white">
                        {standardWarehouses.concat(wasteWarehouses).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            <Button onClick={saveOrder} className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2.5rem] font-black text-2xl shadow-xl border-none cursor-pointer transform transition-all active:scale-95">
              {editingOrder ? 'עדכן משימה ✍️' : 'שגר סידור 🚀'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
