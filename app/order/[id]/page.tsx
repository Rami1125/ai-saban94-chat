"use client";
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Recycle, Send, Search, Clock, MapPin, Package, CheckCircle2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";

export default function SabanMagicLink() {
  const [step, setStep] = useState(1); // 1: הזמנה, 2: בדיקת סטטוס
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState('חומרי בניין');
  const [form, setForm] = useState({
    phone: '', name: '', address: '', date: new Date().toISOString().split('T')[0], time: '07:00', rawList: ''
  });
  const [orderStatus, setOrderStatus] = useState<any>(null);

  const supabase = getSupabase();

  // בדיקה אם הלקוח כבר קיים במאגר (לפי טלפון)
  const checkCustomer = async () => {
    if (!form.phone) return;
    const { data } = await supabase.from('saban_customers').select('*').eq('phone', form.phone).single();
    if (data) {
      setForm({ ...form, name: data.full_name, address: data.default_address });
      toast.success(`ברוך הבא שוב, ${data.full_name}!`);
    }
  };

  const submitOrder = async () => {
    if (!form.phone || !form.name || !form.rawList) return toast.error("נא למלא את כל השדות החיוניים");
    
    setLoading(true);
    try {
      // 1. שמירת לקוח במאגר (אם חדש)
      await supabase.from('saban_customers').upsert({ 
        phone: form.phone, 
        full_name: form.name, 
        default_address: form.address 
      }, { onConflict: 'phone' });

      // 2. שליחה לסידור
      const { error } = await supabase.from('saban_master_dispatch').insert([{
        customer_name: form.name,
        address: form.address,
        scheduled_date: form.date,
        scheduled_time: form.time,
        container_action: orderType,
        customer_phone: form.phone,
        status: 'פתוח',
        created_by: 'לקוח (לינק קסם)',
        order_id_comax: form.rawList
      }]);

      if (error) throw error;

      toast.success("ההזמנה התקבלה במערכת ח. סבן! 🚀");
      setStep(2);
      checkStatus();
    } catch (e: any) {
      toast.error("שגיאה בשליחת ההזמנה");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    const { data } = await supabase
      .from('saban_master_dispatch')
      .select('*')
      .eq('customer_phone', form.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setOrderStatus(data);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-right font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0B2C63] italic uppercase tracking-tighter">ח. סבן</h1>
        <p className="text-blue-600 font-bold text-[10px] tracking-widest uppercase italic">AI Smart Ordering</p>
      </div>

      {step === 1 ? (
        <Card className="max-w-md mx-auto p-6 rounded-[2.5rem] shadow-2xl border-none space-y-6 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setOrderType('חומרי בניין')} 
              className={`p-4 rounded-2xl border-none font-black flex flex-col items-center gap-2 transition-all cursor-pointer ${orderType === 'חומרי בניין' ? 'bg-[#0B2C63] text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <Truck size={24}/> <span className="text-xs">חומרי בניין</span>
            </button>
            <button 
              onClick={() => setOrderType('מכולה')} 
              className={`p-4 rounded-2xl border-none font-black flex flex-col items-center gap-2 transition-all cursor-pointer ${orderType === 'מכולה' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <Recycle size={24}/> <span className="text-xs">מכולה</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase italic">טלפון (לזיהוי מהיר)</label>
              <input onBlur={checkCustomer} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-right font-bold focus:border-blue-500 outline-none transition-all" />
            </div>
            
            <input placeholder="שם מלא" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-right font-bold focus:border-blue-500 outline-none" />
            
            <input placeholder="כתובת אספקה" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-right font-bold focus:border-blue-500 outline-none" />
            
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-right outline-none focus:border-blue-500" />
              <select value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-right outline-none focus:border-blue-500">
                <option value="07:00">07:00</option>
                <option value="09:00">09:00</option>
                <option value="12:00">12:00</option>
                <option value="15:00">15:00</option>
              </select>
            </div>

            <textarea 
              placeholder="רשימת מוצרים / פירוט הבקשה..." 
              value={form.rawList} 
              onChange={e => setForm({...form, rawList: e.target.value})} 
              className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-right font-bold resize-none outline-none focus:border-blue-500" 
            />
          </div>

          <Button onClick={submitOrder} disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xl border-none shadow-xl shadow-blue-100 text-white cursor-pointer transition-transform active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : "שלח הזמנה לסידור 🚀"}
          </Button>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto p-8 rounded-[2.5rem] shadow-2xl border-none space-y-8 text-center bg-white">
          <div className="flex justify-center"><CheckCircle2 size={64} className="text-green-500 animate-bounce"/></div>
          <h2 className="text-2xl font-black text-[#0B2C63] italic underline decoration-blue-100">הזמנתך התקבלה!</h2>
          
          <div className="bg-slate-50 p-6 rounded-2xl space-y-4 text-right border-r-8 border-blue-500">
            <p className="text-[10px] font-black text-slate-400 uppercase italic">סטטוס הזמנה נוכחי:</p>
            <div className="flex justify-between items-center">
              <Badge className="bg-blue-100 text-blue-700 border-none font-black px-4 py-2 text-lg rounded-xl">
                {orderStatus?.status || 'בטיפול'}
              </Badge>
              <div className="text-right">
                <p className="font-black text-slate-800">{orderStatus?.customer_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase italic">שעה: {orderStatus?.scheduled_time}</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setStep(1)} variant="ghost" className="text-slate-400 font-bold border-none hover:bg-slate-50 w-full rounded-xl">ביצוע הזמנה נוספת +</Button>
        </Card>
      )}

      {/* Footer Branding */}
      <div className="mt-12 text-center opacity-20 flex flex-col items-center gap-1">
          <Package size={20} className="text-[#0B2C63]" />
          <p className="text-[8px] font-black uppercase tracking-widest">Saban OS - Magic Link Infrastructure</p>
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
