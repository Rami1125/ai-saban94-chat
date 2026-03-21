"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, Trash2, X, Send, Clock, Warehouse, MapPin, Share2, UserCheck, 
  Recycle, Menu, Edit2, Calendar, RefreshCw, Brain, Loader2, Terminal, Activity,
  Users, Bell, CheckCircle2, Phone, ChevronDown, ChevronUp, Zap, Layout
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- הגדרות ליבה (נשארות כפי שביקשת) ---
const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
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

export default function SabanUnifiedMasterOS() {
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

  // 📁 UI States
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '07:00',
    customer_name: '',
    warehouse_source: 'התלמיד (1)',
    driver_name: 'חכמת',
    created_by: 'ראמי',
    order_id_comax: '',
    address: '',
    container_action: 'הצבה'
  });

  const supabase = getSupabase();

  const fetchData = useCallback(async () => {
    try {
      const { data: ordersData } = await supabase.from('saban_master_dispatch').select('*').order('scheduled_time', { ascending: true });
      const { data: clientsData } = await supabase.from('saban_customers').select('*');
      const { data: reqsData } = await supabase.from('saban_customer_requests').select('*').eq('status', 'pending');
      
      setOrders(ordersData || []);
      setCustomers(clientsData || []);
      setRequests(reqsData || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('unified_live').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData, supabase]);

  // 🔥 פונקציית אישור בקשת לקוח מהירה
  const approveRequest = async (req: any) => {
    toast.loading("מעבד בקשת לקוח...");
    await supabase.from('saban_customer_requests').update({ status: 'approved' }).eq('id', req.id);
    const { error } = await supabase.from('saban_master_dispatch').insert([{
        customer_id: req.customer_id,
        customer_name: customers.find(c => c.customer_id === req.customer_id)?.full_name || 'לקוח אפליקציה',
        container_action: req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה',
        status: 'אושר להפצה',
        address: req.details?.address || 'עודכן מהנייד',
        scheduled_time: '08:00', // ברירת מחדל לאישור מהיר
        driver_name: 'פינוי פסולת',
        warehouse_source: 'כראדי (32)'
    }]);
    if (!error) {
        toast.dismiss();
        toast.success("בקשה אושרה ושובצה בסידור!");
        fetchData();
    }
  };

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
        if (data.executionResult?.includes('✅')) {
          fetchData();
          toast.success("המוח עדכן את המערכת! 🦾");
        }
      }
    } catch (e) { toast.error("נתק במוח"); } finally { setIsAiTyping(false); }
  };

  const generateWAMessage = (order: any) => {
    const actionInfo = order.driver_name === 'פינוי פסולת' ? `\n♻️ *פעולה:* ${order.container_action}` : '';
    const emoji = order.driver_name === 'פינוי פסולת' ? '♻️' : '📦';
    return `${emoji} *סידור ח. סבן חומרי בניין*\n---------------------------\n👤 *לקוח:* ${order.customer_name}\n🆔 *מספר:* ${order.order_id_comax}\n🚛 *נהג:* ${order.driver_name}${actionInfo}\n⏰ *שעה:* ${order.scheduled_time}\n🏭 *מחסן:* ${order.warehouse_source}\n---------------------------\n_נציג מעדכן: ${order.created_by}_`;
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
      setForm({ ...form, customer_name: '', order_id_comax: '', address: '' });
      fetchData();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-[#0B2C63] italic text-2xl uppercase">Saban OS Unified - Connecting...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* --- Header & Unified Menu --- */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-2xl mb-8 flex justify-between items-center sticky top-0 z-[100] border-b border-blue-400/20">
        <div className="flex gap-3">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 bg-white/10 rounded-2xl border-none text-white cursor-pointer hover:bg-white/20 transition-all"><Menu size={28}/></button>
          <button onClick={() => setShowAiMobile(true)} className="lg:hidden p-3 bg-blue-500/30 rounded-2xl border-none text-white cursor-pointer"><Brain size={28}/></button>
        </div>
        
        <div className="text-center">
            <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">ח.סבן</h1>
            <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-bold text-blue-300 uppercase tracking-[0.3em] italic leading-none">Unified Air Console</p>
            </div>
        </div>

        <div className="flex gap-2">
            <Button onClick={() => setActiveView(activeView === 'dispatch' ? 'customers' : 'dispatch')} className="bg-white/10 hover:bg-white/20 rounded-xl font-black h-12 border-none px-4 flex gap-2">
                {activeView === 'dispatch' ? <Users size={18}/> : <Layout size={18}/>}
                <span className="hidden md:block">{activeView === 'dispatch' ? 'ניהול לקוחות' : 'לוח סידור'}</span>
            </Button>
            <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-500 rounded-xl font-black h-12 border-none px-6 shadow-xl text-white">+ חדש</Button>
        </div>
      </div>

      {/* --- Sidebar Menu (Glassmorphism) --- */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex justify-end">
              <aside className="w-80 bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center mb-10">
                      <h2 className="text-2xl font-black italic text-blue-900">תפריט SabanOS</h2>
                      <button onClick={() => setIsMenuOpen(false)}><X/></button>
                  </div>
                  <nav className="space-y-4">
                      <button onClick={() => {setActiveView('dispatch'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${activeView === 'dispatch' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'hover:bg-slate-50 text-slate-500'}`}>
                          <Layout size={20}/> לוח סידור נהגים
                      </button>
                      <button onClick={() => {setActiveView('customers'); setIsMenuOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all ${activeView === 'customers' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'hover:bg-slate-50 text-slate-500'}`}>
                          <Users size={20}/> ניהול לקוחות & פניות
                      </button>
                      <button className="w-full flex items-center gap-4 p-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50">
                          <Activity size={20}/> דוח ביצועים יומי
                      </button>
                  </nav>
              </aside>
          </div>
      )}

      {/* --- תוכן דינמי: לוח סידור --- */}
      {activeView === 'dispatch' && (
        <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in duration-500">
            {drivers.map((driver) => (
            <div key={driver.id} className="space-y-6">
                <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none relative overflow-hidden ring-1 ring-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                    <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white" />
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                        <Badge className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] uppercase">{driver.defaultType}</Badge>
                    </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {timeSlots.map(time => {
                        const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time === time);
                        return (
                        <div key={time} onClick={() => { setForm({...form, driver_name: driver.name, scheduled_time: time}); setShowForm(true); }}
                            className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${hasOrder ? 'bg-[#0B2C63] border-blue-400 shadow-lg scale-105' : 'bg-slate-50 border-slate-100 group-hover:border-blue-200'}`}>
                            {hasOrder ? <Truck size={20} className="text-white animate-pulse" /> : <Plus size={16} className="text-slate-200 group-hover:text-blue-300" />}
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{time}</span>
                        </div>
                        );
                    })}
                    </div>
                </Card>

                <div className="space-y-4">
                {orders.filter(o => o.driver_name === driver.name).map((order) => (
                    <Card key={order.id} className="p-6 rounded-[2.5rem] bg-white shadow-lg border-none relative group border-r-8 border-r-[#0B2C63] hover:translate-x-[-4px] transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black italic">{order.scheduled_time}</div>
                                <div className="text-right">
                                    <div className="font-black text-slate-800 text-xl">{order.customer_name}</div>
                                    <div className="text-blue-600 font-bold text-xs flex items-center gap-1"><Hash size={10}/>{order.order_id_comax}</div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90">
                                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generateWAMessage(order))}`, '_blank')} className="p-2 bg-green-50 text-green-600 rounded-xl border-none cursor-pointer hover:bg-green-600 hover:text-white transition-all"><RefreshCw size={16}/></button>
                                <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl border-none cursor-pointer hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={16}/></button>
                                <button onClick={() => { if(confirm('למחוק?')) supabase.from('saban_master_dispatch').delete().eq('id', order.id).then(fetchData); }} className="p-2 bg-red-50 text-red-500 rounded-xl border-none cursor-pointer hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-50 text-[11px] font-bold text-slate-400">
                            <div className="flex items-center gap-2 truncate"><MapPin size={14} className="text-red-400 opacity-50"/> {order.address || 'בשטח'}</div>
                            <div className="flex items-center gap-2"><Warehouse size={14} className="text-blue-400 opacity-50"/> {order.warehouse_source}</div>
                            {order.driver_name === 'פינוי פסולת' && <div className="flex items-center gap-2 bg-green-50 text-green-600 px-2 py-1 rounded-lg"><Recycle size={12}/> {order.container_action}</div>}
                        </div>
                    </Card>
                ))}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- תוכן דינמי: ניהול לקוחות & פניות (The Radar View) --- */}
      {activeView === 'customers' && (
          <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in slide-in-from-left duration-500">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-white rounded-3xl shadow-sm"><Users size={32} className="text-blue-700"/></div>
                  <div>
                      <h2 className="text-3xl font-black italic text-slate-800">ניטור פניות & תיקי לקוחות</h2>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Client Network</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {customers.map(client => {
                    const clientReq = requests.find(r => r.customer_id === client.customer_id);
                    const isExpanded = expandedCustomer === client.id;
                    return (
                        <Card key={client.id} className={`group relative rounded-[2.5rem] border-none shadow-xl transition-all duration-700 overflow-hidden ${clientReq ? 'bg-white ring-4 ring-green-400 animate-pulse-slow shadow-green-100' : 'bg-white/70 backdrop-blur-sm'}`}>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl transition-all ${clientReq ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Activity size={24} className={clientReq ? 'animate-spin-slow' : ''}/>
                                    </div>
                                    <div className="text-left">
                                        <Badge className={`border-none font-black italic mb-1 ${clientReq ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                            {clientReq ? 'פנייה ממתינה!' : 'מחובר'}
                                        </Badge>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter block text-right">ID: {client.customer_id}</p>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 mb-2 italic">{client.full_name}</h3>
                                <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1 justify-start"><MapPin size={12}/> {client.address}</p>

                                {clientReq ? (
                                    <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 space-y-4 animate-in zoom-in">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-green-600">
                                            <span>פעולה מבוקשת:</span>
                                            <span className="bg-green-600 text-white px-2 py-0.5 rounded">{clientReq.action_type}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => approveRequest(clientReq)} className="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black text-xs shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                                                <CheckCircle2 size={16}/> אשר בסידור
                                            </button>
                                            <button className="bg-white text-red-400 p-4 rounded-2xl border border-red-50 hover:bg-red-50 transition-all"><X size={18}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setExpandedCustomer(isExpanded ? null : client.id)} className="w-full flex items-center justify-between bg-slate-50 p-4 rounded-2xl hover:bg-blue-50 transition-all text-xs font-black italic text-slate-600">
                                            פרטים נוספים והיסטוריה {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                        </button>
                                        
                                        {/* תפריט נפתח לפרטי לקוח */}
                                        {isExpanded && (
                                            <div className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center justify-between p-3 bg-white rounded-xl text-[11px] font-bold shadow-sm">
                                                    <span className="text-slate-400">נייד:</span>
                                                    <span className="text-slate-800">{client.phone}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                                                        <MessageSquare size={14}/> צאט AI
                                                    </button>
                                                    <button className="flex-1 bg-white border border-slate-100 text-slate-500 p-3 rounded-xl font-black text-[10px] flex items-center justify-center gap-2">
                                                        <Phone size={14}/> התקשר
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
              </div>
          </div>
      )}

      {/* --- Saban AI Brain Control - Desktop (ממוקם קבוע למטה) --- */}
      <div className="hidden lg:block fixed bottom-8 left-8 right-8 z-[80]">
        <div className="max-w-[1800px] mx-auto grid grid-cols-4 gap-6 items-end">
          <Card className="col-span-3 bg-[#0B2C63]/95 backdrop-blur-xl rounded-[3rem] p-6 text-white shadow-2xl flex flex-col justify-between border border-blue-400/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-500 p-3 rounded-2xl"><Brain size={24} className="text-white" /></div>
              <div>
                <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Saban AI Brain Control</h2>
              </div>
            </div>

            <div className="flex gap-4">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiCommand()} placeholder="ראמי, מה הפקודה?" className="flex-1 h-14 bg-white/10 border-none rounded-2xl px-6 text-white font-bold outline-none text-right placeholder:text-blue-300/50" />
              <button onClick={handleAiCommand} className="w-16 h-14 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-500/20">{isAiTyping ? <Loader2 className="animate-spin" /> : <Send size={20} />}</button>
            </div>
            
            {aiReport?.shareLink && (
              <Button onClick={() => window.open(aiReport.shareLink, '_blank')} className="mt-4 w-full bg-green-600 hover:bg-green-500 rounded-2xl font-black h-12 border-none text-white shadow-xl flex gap-2 items-center justify-center">
                <Share2 size={18}/> שלח סידור לקבוצה
              </Button>
            )}
          </Card>

          <Card className="bg-slate-900/95 backdrop-blur-xl rounded-[3rem] p-6 text-white border border-white/5">
            <div className="flex items-center gap-2 mb-4 text-green-400"><Terminal size={18}/><span className="text-[10px] font-black uppercase">System Logs</span></div>
            <div className="bg-black/40 p-3 rounded-2xl text-[10px] font-black text-blue-400 italic leading-tight h-20 overflow-hidden">
                {aiReport?.executionResult || "> Ready for input..."}
            </div>
          </Card>
        </div>
      </div>

      {/* --- AI Mobile Drawer --- */}
      {showAiMobile && (
        <div className="fixed inset-0 bg-[#0B2C63] z-[300] flex flex-col animate-in slide-in-from-bottom">
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3"><Brain className="text-blue-400" size={24}/><h2 className="text-white font-black italic">SABAN AI</h2></div>
            <button onClick={() => setShowAiMobile(false)} className="bg-white/10 p-2 rounded-full border-none text-white"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-right no-scrollbar">
             {aiMessages.map((m, i) => (
                <div key={i} className={`p-4 rounded-[2rem] font-bold text-sm ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-blue-600 text-white'}`}>{m.content}</div>
             ))}
          </div>
          <div className="p-6 bg-white/5 flex flex-col gap-4">
            <div className="flex gap-2">
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="פקודה למוח..." className="flex-1 h-14 bg-white/10 border-none rounded-2xl px-4 text-white font-bold text-right outline-none" />
              <button onClick={handleAiCommand} className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center border-none shadow-xl"><Send size={20}/></button>
            </div>
          </div>
        </div>
      )}

      {/* --- Form Overlay --- */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <Card className="bg-white w-full max-w-lg rounded-[3rem] p-8 space-y-6 shadow-2xl border-none text-right my-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#0B2C63] italic uppercase tracking-tighter underline decoration-blue-100 underline-offset-8">{editingOrder ? 'עריכת משימה' : 'הזמנה חדשה'}</h2>
              <button onClick={() => { setShowForm(false); setEditingOrder(null); }} className="bg-slate-100 p-2 rounded-full border-none text-slate-400 hover:text-black transition-all"><X size={24}/></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {teamMembers.map(m => (
                    <button key={m} onClick={() => setForm({...form, created_by: m})}
                            className={`py-3 rounded-2xl text-[11px] font-black border-none transition-all cursor-pointer ${form.created_by === m ? 'bg-blue-600 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-400'}`}>
                        {m}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 italic">תאריך</label>
                    <input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold text-right outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 mr-2 italic">שעה</label>
                    <select value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold bg-white text-right outline-none">
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <input placeholder="שם הלקוח" value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 font-black text-lg text-right outline-none focus:border-blue-600" />
            <input placeholder="מספר קומקס" value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-slate-50 font-black text-lg text-right outline-none focus:border-blue-600" />
            
            <div className="grid grid-cols-2 gap-4">
              <select value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="w-full h-14 px-4 rounded-xl border-2 border-slate-50 font-bold text-right bg-white">
                  {drivers.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
              <select value={form.warehouse_source} onChange={e => setForm({...form, warehouse_source: e.target.value})} className="w-full h-14 px-4 rounded-xl border-2 border-slate-50 font-bold text-right bg-white">
                  {standardWarehouses.concat(wasteWarehouses).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            
            {form.driver_name === 'פינוי פסולת' && (
              <select value={form.container_action} onChange={e => setForm({...form, container_action: e.target.value})} className="w-full h-14 px-6 rounded-2xl border-2 border-green-100 font-bold text-right bg-white animate-in slide-in-from-top-2">
                  {containerActions.map(act => <option key={act} value={act}>{act}</option>)}
              </select>
            )}

            <Button onClick={saveOrder} className="w-full h-18 bg-green-600 hover:bg-green-500 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all border-none cursor-pointer mt-4">שמור ושלח ווטסאפ 🚀</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
