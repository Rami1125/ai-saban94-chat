"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, ChevronDown, Trash2, X, Send, 
  Clock, Warehouse, MapPin, Share2, UserCheck, HardHat, Recycle, Menu, Edit2, Calendar, RefreshCw, Brain, Loader2, Activity, Terminal, CheckCircle2
} from "lucide-react";
import { toast, Toaster } from "sonner";

// דאטה בסיסי
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
const containerActions = ['הצבה', 'החלפה', 'הוצאה'];
const wasteWarehouses = ['שארק (30)', 'כראדי (32)', 'שי שרון (40)'];
const standardWarehouses = ['התלמיד (1)', 'החרש (4)'];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanMasterDispatch() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  
  // 🔥 AI & Inspector State
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAiMobile, setShowAiMobile] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

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
    status: 'פתוח'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('master_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  // 🔥 הפעלת המוח (AI Command)
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
      setAiReport(data); // עדכון ה"מלשינון"

      if (data.aiResponse) {
        setAiMessages(prev => [...prev, { role: 'ai', content: data.aiResponse }]);
        if (data.executionResult?.includes('✅')) {
          fetchData();
          toast.success("סידור עודכן מהמוח! 🦾");
        }
      }
    } catch (e) {
      toast.error("נתק מול המוח בשרת");
    } finally {
      setIsAiTyping(false);
    }
  };

  const generateWAMessage = (order: any) => {
    const emoji = order.driver_name === 'פינוי פסולת' ? '♻️' : '📦';
    return `${emoji} *סידור ח. סבן חומרי בניין*\n---------------------------\n👤 *לקוח:* ${order.customer_name}\n🚦 *סטטוס:* ${order.status}\n🚛 *נהג:* ${order.driver_name}\n⏰ *שעה:* ${order.scheduled_time}\n🏭 *מחסן:* ${order.warehouse_source}\n---------------------------\n_נציג מעדכן: ${order.created_by}_`;
  };

  const saveOrder = async () => {
    if (!form.customer_name || !form.order_id_comax) return toast.error("חסר נתונים");
    const payload = { ...form, start_process_time: new Date().toISOString() };
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(payload).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([payload]);

    if (!error) {
      toast.success(editingOrder ? "עודכן!" : "נשמר!");
      if (!editingOrder) window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(form))}`, '_blank');
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63] italic text-2xl uppercase">Saban OS - Syncing...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center relative z-50">
        <div className="flex gap-2">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-white/10 rounded-xl border-none text-white transition-all cursor-pointer">
            {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
          </button>
          <button onClick={() => setShowAiMobile(true)} className="lg:hidden p-2 bg-blue-500/30 rounded-xl border-none text-white transition-all cursor-pointer">
            <Brain size={28} className={isAiTyping ? "animate-pulse" : ""}/>
          </button>
        </div>
        
        <div className="text-center">
            <h1 className="text-xl font-black italic tracking-tighter leading-tight text-white uppercase">ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest italic">Master Dispatch</p>
        </div>
        <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-600 rounded-xl font-black h-10 px-4 border-none shadow-lg text-white">חדש +</Button>
        
        {isMenuOpen && (
          <div className="absolute top-24 right-6 left-6 bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-100 animate-in slide-in-from-top-4 z-[60]">
             <button onClick={shareMorningReport} className="w-full flex items-center gap-3 p-5 hover:bg-slate-50 rounded-2xl text-[#0B2C63] font-black border-none text-right transition-colors cursor-pointer">
                <Share2 size={22} className="text-blue-600"/> שלח דוח סידור לוואטסאפ
             </button>
          </div>
        )}
      </header>

      {/* Main Grid */}
      <main className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {drivers.map((driver) => (
          <div key={driver.id} className="space-y-6">
            <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 leading-tight">{driver.name}</h2>
                    <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] uppercase">{driver.defaultType}</Badge>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {timeSlots.map(time => {
                    const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                    return (
                      <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setEditingOrder(null); setShowForm(true); }}
                           className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}>
                          {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Plus size={16} className="text-slate-300" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{time}</span>
                      </div>
                    );
                  })}
                </div>
            </Card>

            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="p-6 rounded-[2rem] bg-white shadow-lg border-none relative group border-r-8 border-r-[#0B2C63] hover:scale-[1.01] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black italic shadow-inner">{order.scheduled_time}</div>
                            <div className="text-right">
                                <div className="font-black text-slate-800 text-xl leading-tight">{order.customer_name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`border-none font-black text-[9px] uppercase px-2 py-0.5 ${getStatusStyle(order.status)}`}>{order.status}</Badge>
                                    <span className="text-slate-400 font-bold text-[10px]">#{order.order_id_comax}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg border-none cursor-pointer"><Edit2 size={16}/></button>
                             <button onClick={() => { if(confirm('למחוק הזמנה?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-lg border-none cursor-pointer"><Trash2 size={16}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-500 text-right">
                        <div className="flex items-center gap-2 truncate"><MapPin size={14} className="text-red-400"/> {order.address || 'איסוף עצמי'}</div>
                        <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400"/> {order.warehouse_source}</div>
                        <div className="flex items-center gap-2"><UserCheck size={14} className="text-orange-400"/> {order.created_by}</div>
                        {order.driver_name === 'פינוי פסולת' && <div className="flex items-center gap-2"><Recycle size={14} className="text-green-500"/> {order.container_action}</div>}
                    </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* 🔥 Desktop AI Control Center */}
      <div className="hidden lg:block max-w-[1800px] mx-auto px-4 mt-12 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Console */}
          <Card className="lg:col-span-2 bg-[#0B2C63] rounded-[3rem] p-8 shadow-2xl border-none relative overflow-hidden flex flex-col justify-between min-h-[350px]">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="flex items-center gap-6 mb-4">
              <div className="bg-blue-500 p-4 rounded-[1.5rem] shadow-lg shadow-blue-500/30">
                <Brain size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Saban AI Brain</h2>
                <p className="text-blue-300 text-sm font-bold uppercase tracking-widest">מערכת פקודות חכמה לשליטה ב-SQL</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 flex-1 mb-4 overflow-y-auto no-scrollbar space-y-3">
              {aiMessages.length === 0 && <p className="text-blue-300/40 text-center font-bold italic py-10">ממתין לפקודה שלך, ראמי... (למשל: "תשנה סטטוס לאדר בניה ל'בביצוע'")</p>}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                   <div className={`p-3 rounded-2xl font-bold text-sm ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-blue-600 text-white border-r-4 border-blue-400'}`}>
                      {m.content}
                   </div>
                </div>
              ))}
              {isAiTyping && <Loader2 className="animate-spin text-blue-400 mx-auto" />}
            </div>

            <div className="flex gap-4">
              <input 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
                placeholder="כתוב פקודה לביצוע..."
                className="flex-1 h-16 bg-white/10 border-2 border-white/10 rounded-2xl px-6 text-white font-bold outline-none focus:border-blue-400 text-right"
              />
              <button onClick={handleAiCommand} className="w-20 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl flex items-center justify-center border-none cursor-pointer"><Send size={24} /></button>
            </div>
          </Card>

          {/* Inspector (מלשינון) */}
          <Card className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl border-none text-white overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Terminal size={24} className="text-green-400"/>
              <h3 className="font-black italic uppercase tracking-widest text-sm">System Inspector</h3>
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="bg-black/30 p-4 rounded-2xl space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Database:</span>
                    <span className={aiReport?.dbStatus?.includes('✅') ? "text-green-400 font-black" : "text-red-400"}>{aiReport?.dbStatus || "OFFLINE"}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Sync Latency:</span>
                    <span className="text-blue-400 font-black">{aiReport?.latency || "0ms"}</span>
                 </div>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl flex-1">
                 <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Last SQL Execution:</p>
                 <div className={`text-xs font-black leading-relaxed ${aiReport?.executionResult?.includes('✅') ? 'text-green-400' : 'text-orange-400'}`}>
                    {aiReport?.executionResult || "> Awaiting signal..."}
                 </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 🔥 Mobile AI Drawer */}
      {showAiMobile && (
        <div className="fixed inset-0 bg-[#0B2C63] z-[200] flex flex-col animate-in slide-in-from-bottom">
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3"><Brain className="text-blue-400" size={24}/><h2 className="text-white font-black italic">SABAN AI</h2></div>
            <button onClick={() => setShowAiMobile(false)} className="bg-white/10 p-2 rounded-full border-none text-white cursor-pointer"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-right no-scrollbar">
             {aiMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-4 rounded-[2rem] font-bold text-sm ${m.role === 'user' ? 'bg-white/10 text-white rounded-bl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
                    {m.content}
                  </div>
                </div>
             ))}
          </div>
          <div className="p-6 bg-white/5 border-t border-white/10 flex gap-2">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="פקודה למוח..." className="flex-1 h-14 bg-white/10 border-none rounded-xl px-4 text-white font-bold outline-none text-right" />
            <button onClick={handleAiCommand} className="bg-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center border-none"><Send size={20}/></button>
          </div>
        </div>
      )}

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-6 shadow-2xl border-none text-right overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-[#0B2C63] italic">{editingOrder ? 'עריכת משימה' : 'הזמנה חדשה'}</h2>
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black transition-colors"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setForm({...form, created_by: m})}
                            className={`py-4 rounded-2xl text-[11px] font-black border-none transition-all cursor-pointer ${form.created_by === m ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-slate-100 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">תאריך</label>
                    <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-blue-500 text-right" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">שעה</label>
                    <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 font-bold bg-white outline-none focus:border-blue-500 text-right">
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 mr-2 uppercase italic tracking-widest">סטטוס לוגיסטי</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-blue-100 font-black text-right outline-none focus:border-blue-500 bg-white">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-black text-lg text-right outline-none focus:border-blue-500" />
            <input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-100 font-black text-lg text-right outline-none focus:border-blue-500" />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">נהג</label>
                    <select value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="w-full h-14 px-4 rounded-xl border-2 border-slate-100 font-bold text-right outline-none focus:border-blue-500 bg-white">
                        {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic tracking-widest">מחסן</label>
                    <select value={form.warehouse_source} onChange={e => setForm({...form, warehouse_source: e.target.value})} className="w-full h-14 px-4 rounded-xl border-2 border-slate-100 font-bold text-right outline-none focus:border-blue-500 bg-white">
                        {standardWarehouses.concat(wasteWarehouses).map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            <Button onClick={saveOrder} className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl shadow-xl transition-all border-none active:scale-95 cursor-pointer">
              {editingOrder ? 'עדכן סידור עבודה ✍️' : 'שמור ושגר לוואטסאפ 🚀'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
