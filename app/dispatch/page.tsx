"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, Trash2, X, Send, Clock, Warehouse, MapPin, Share2, UserCheck, 
  Recycle, Menu, Edit2, Calendar, RefreshCw, Brain, Loader2, Terminal, Activity,
  Users, Bell, CheckCircle2, Phone, ChevronDown, ChevronUp, Zap, Layout, Hash,
  MessageSquare, Search, CheckCircle, Package, Map, PlayCircle
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- הגדרות סטטוסים וצבעים ---
const orderStatuses = [
  { id: 'הזמנה התקבלה', color: 'bg-orange-500', icon: <Bell size={12}/> },
  { id: 'בהכנה', color: 'bg-blue-500', icon: <Package size={12}/> },
  { id: 'בדרך', color: 'bg-purple-500', icon: <Truck size={12}/> },
  { id: 'סופקה', color: 'bg-green-600', icon: <CheckCircle size={12}/> }
];

const drivers = [
  { id: 'hakmat', name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg', color: '#0B2C63', defaultType: 'מנוף 🏗️' },
  { id: 'ali', name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg', color: '#2563EB', defaultType: 'משאית 🚛' },
  { id: 'waste', name: 'פינוי פסולת', img: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png', color: '#16a34a', defaultType: 'מכולה ♻️' }
];

export default function SabanUnifiedMasterOS() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [activeView, setActiveView] = useState<'dispatch' | 'customers'>('dispatch');
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    order_id_comax: '',
    address: '',
    scheduled_time: '07:00',
    driver_name: 'חכמת',
    warehouse_source: 'התלמיד (1)',
    container_action: 'הצבה',
    status: 'הזמנה התקבלה',
    created_by: 'ראמי'
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
    const sub = supabase.channel('master_v3').on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchData]);

  // --- לוגיקה: שליפה חכמה תוך כדי הקלדה ---
  const handleCustomerSearch = (val: string) => {
    setForm(prev => ({ ...prev, customer_name: val }));
    const found = customers.find(c => c.full_name.includes(val) || c.customer_id.includes(val));
    if (found && val.length > 2) {
      setForm(prev => ({ 
        ...prev, 
        customer_id: found.customer_id, 
        customer_name: found.full_name, 
        address: found.address 
      }));
      toast.info(`נשלפו פרטים עבור ${found.full_name}`, { duration: 1000 });
    }
  };

  // --- לוגיקה: אישור פנייה והפיכה להזמנה ---
  const approveRequest = async (req: any) => {
    toast.loading("הופך פנייה להזמנה חי בלוח...");
    const client = customers.find(c => c.customer_id === req.customer_id);
    
    // 1. סגירת הפנייה
    await supabase.from('saban_customer_requests').update({ status: 'approved' }).eq('id', req.id);
    
    // 2. יצירת ההזמנה
    const newOrder = {
      customer_id: req.customer_id,
      customer_name: client?.full_name || 'לקוח מערכת',
      order_id_comax: '62122110', // מספר שהגדרת כברירת מחדל
      address: req.details?.address || client?.address,
      status: 'הזמנה התקבלה',
      container_action: req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה',
      driver_name: 'פינוי פסולת',
      scheduled_time: '08:00',
      warehouse_source: 'כראדי (32)'
    };

    const { error } = await supabase.from('saban_master_dispatch').insert([newOrder]);
    if (!error) {
      toast.dismiss();
      toast.success("בוצע! ההזמנה מופיעה כעת בסטטוס 'התקבלה'");
      fetchData();
    }
  };

  const saveOrder = async () => {
    const { error } = editingOrder 
      ? await supabase.from('saban_master_dispatch').update(form).eq('id', editingOrder.id)
      : await supabase.from('saban_master_dispatch').insert([form]);

    if (!error) {
      toast.success("נשמר בהצלחה");
      setShowForm(false);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[3rem] shadow-2xl mb-8 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex gap-3">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 bg-white/10 rounded-2xl text-white border-none cursor-pointer"><Menu size={28}/></button>
          <div className="hidden lg:flex gap-2">
            <Button onClick={() => setActiveView('dispatch')} className={`rounded-xl font-black h-12 border-none px-6 ${activeView === 'dispatch' ? 'bg-blue-600' : 'bg-white/10'}`}>לוח סידור</Button>
            <Button onClick={() => setActiveView('customers')} className={`rounded-xl font-black h-12 border-none px-6 ${activeView === 'customers' ? 'bg-blue-600' : 'bg-white/10'}`}>לקוחות {requests.length > 0 && <span className="mr-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}</Button>
          </div>
        </div>
        <div className="text-center">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">ח.סבן</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.4em] mt-1">Real-time Command</p>
        </div>
        <Button onClick={() => { setEditingOrder(null); setShowForm(true); }} className="bg-green-600 hover:bg-green-500 rounded-xl font-black h-12 border-none px-8 shadow-xl text-white">+ חדש</Button>
      </div>

      {/* --- לוח סידור עם סטטוסים דינמיים --- */}
      {activeView === 'dispatch' && (
        <div className="max-w-[1800px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in">
            {drivers.map((driver) => (
            <div key={driver.id} className="space-y-6">
                <Card className="bg-white p-6 rounded-[2.5rem] shadow-xl border-none">
                    <div className="flex items-center gap-4 mb-6">
                        <img src={driver.img} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
                        <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                    </div>
                    {/* ציר זמן מהיר */}
                </Card>
                <div className="space-y-4">
                    {orders.filter(o => o.driver_name === driver.name).map((order) => {
                        const currentStatus = orderStatuses.find(s => s.id === order.status) || orderStatuses[0];
                        return (
                            <Card key={order.id} className="p-6 rounded-[2.5rem] bg-white shadow-lg border-none relative group border-r-8 border-r-[#0B2C63]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4 text-right">
                                        <div className="bg-[#0B2C63] text-white px-3 py-2 rounded-xl text-xs font-black italic">{order.scheduled_time}</div>
                                        <div>
                                            <div className="font-black text-slate-800 text-xl leading-none mb-1">{order.customer_name}</div>
                                            <Badge className={`${currentStatus.color} text-white border-none font-black text-[10px] italic flex items-center gap-1`}>
                                                {currentStatus.icon} {order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingOrder(order); setForm(order); setShowForm(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl border-none"><Edit2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="text-[11px] font-bold text-slate-400 border-t border-slate-50 pt-4 flex justify-between">
                                    <span className="flex items-center gap-1"><MapPin size={12}/> {order.address}</span>
                                    <span className="font-black text-blue-600">#{order.order_id_comax}</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- ניהול פניות לקוחות (המלשינון) --- */}
      {activeView === 'customers' && (
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-left">
            {requests.map(req => {
                const client = customers.find(c => c.customer_id === req.customer_id);
                return (
                    <Card key={req.id} className="p-8 rounded-[3rem] bg-white ring-4 ring-green-400 animate-pulse-slow border-none shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-200"><Activity size={24} className="animate-spin-slow"/></div>
                            <Badge className="bg-green-100 text-green-700 border-none font-black italic uppercase">פנייה חיה מהאפליקציה</Badge>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-1 italic">{client?.full_name || 'טוען...'}</h3>
                        <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1"><MapPin size={12}/> {client?.address}</p>
                        
                        <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 space-y-4">
                            <p className="text-xs font-black text-green-800 uppercase italic">בקשת {req.action_type === 'EXCHANGE' ? 'החלפה' : 'הצבה'}</p>
                            <button onClick={() => approveRequest(req)} className="w-full bg-green-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95">
                                <CheckCircle2 size={18}/> אשר והפוך להזמנה חי
                            </button>
                        </div>
                    </Card>
                );
            })}
            {requests.length === 0 && (
                <div className="col-span-full text-center py-20 opacity-20 font-black italic text-2xl">אין פניות ממתינות כרגע</div>
            )}
          </div>
      )}

      {/* --- Form: יצירת הזמנה עם שליפה חכמה --- */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B2C63]/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <Card className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 space-y-6 shadow-2xl border-none text-right">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-[#0B2C63] italic uppercase underline decoration-blue-100 underline-offset-8 tracking-tighter">ניהול משימה</h2>
                <button onClick={() => setShowForm(false)} className="bg-slate-100 p-2 rounded-full border-none text-slate-400"><X size={24}/></button>
            </div>

            <div className="space-y-4">
                {/* שדה חיפוש ושליפה */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input 
                        placeholder="הקלד שם לקוח או מספר לקוח לשליפה..." 
                        value={form.customer_name} 
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        className="w-full h-16 px-6 rounded-2xl border-2 border-blue-50 font-black text-lg text-right outline-none focus:border-blue-500 transition-all pr-12" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 text-right">
                    <div className="space-y-1 px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase italic">מספר קומקס</label>
                        <input value={form.order_id_comax} onChange={e => setForm({...form, order_id_comax: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold text-right" />
                    </div>
                    <div className="space-y-1 px-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase italic">כתובת</label>
                        <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full h-12 px-4 rounded-xl border-2 border-slate-50 font-bold text-right" />
                    </div>
                </div>

                <div className="space-y-1 px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic underline decoration-blue-500 decoration-2 underline-offset-2">סטטוס הזמנה (דינמי)</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {orderStatuses.map(s => (
                            <button key={s.id} onClick={() => setForm({...form, status: s.id})} 
                                className={`py-3 rounded-xl text-[9px] font-black border-none transition-all ${form.status === s.id ? `${s.color} text-white shadow-lg scale-105` : 'bg-slate-50 text-slate-400 opacity-50'}`}>
                                {s.id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={saveOrder} className="w-full h-20 bg-blue-700 hover:bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl border-none cursor-pointer mt-4">שמור וסנכרן לוח 🚀</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
