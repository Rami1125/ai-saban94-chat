"use client";
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Recycle, Send, Search, Clock, MapPin, Package CheckCircle2 } from "lucide-react";
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
    const { data } = await supabase.from('saban_customers').select('*').eq('phone', form.phone).single();
    if (data) {
      setForm({ ...form, name: data.full_name, address: data.default_address });
      toast.success(`ברוך הבא שוב, ${data.full_name}!`);
    }
  };

  const submitOrder = async () => {
    setLoading(true);
    // 1. שמירת לקוח במאגר (אם חדש)
    await supabase.from('saban_customers').upsert({ phone: form.phone, full_name: form.name, default_address: form.address }, { onConflict: 'phone' });

    // 2. שליחה לסידור (המוח יפענח את הרשימה בשרת)
    const { error } = await supabase.from('saban_master_dispatch').insert([{
      customer_name: form.name,
      address: form.address,
      scheduled_date: form.date,
      scheduled_time: form.time,
      container_action: orderType,
      customer_phone: form.phone,
      status: 'פתוח',
      created_by: 'לקוח (לינק קסם)',
      order_id_comax: form.rawList // הרשימה המלוכלכת נשמרת כאן לבינתיים
    }]);

    if (!error) {
      toast.success("ההזמנה התקבלה במערכת ח. סבן! 🚀");
      setStep(2); // עובר לבדיקת סטטוס
      checkStatus();
    }
    setLoading(false);
  };

  const checkStatus = async () => {
    const { data } = await supabase.from('saban_master_dispatch').select('*').eq('customer_phone', form.phone).order('created_at', { ascending: false }).limit(1).single();
    setOrderStatus(data);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 text-right font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0B2C63] italic uppercase">ח. סבן</h1>
        <p className="text-blue-600 font-bold text-xs tracking-widest uppercase">הזמנה מהירה מהנייד</p>
      </div>

      {step === 1 ? (
        <Card className="max-w-md mx-auto p-6 rounded-[2.5rem] shadow-2xl border-none space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setOrderType('חומרי בניין')} className={`p-4 rounded-2xl border-none font-black flex flex-col items-center gap-2 transition-all ${orderType === 'חומרי בניין' ? 'bg-[#0B2C63] text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Truck size={24}/> חומרי בניין
            </button>
            <button onClick={() => setOrderType('מכולה')} className={`p-4 rounded-2xl border-none font-black flex flex-col items-center gap-2 transition-all ${orderType === 'מכולה' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Recycle size={24}/> מכולה
            </button>
          </div>

          <div className="space-y-4">
            <input placeholder="מספר טלפון" onBlur={checkCustomer} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-14 bg-slate-50 border-none rounded-xl px-4 text-right font-bold" />
            <input placeholder="שם מלא" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-14 bg-slate-50 border-none rounded-xl px-4 text-right font-bold" />
            <input placeholder="כתובת אספקה" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full h-14 bg-slate-50 border-none rounded-xl px-4 text-right font-bold" />
            
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="bg-slate-50 border-none rounded-xl p-3 font-bold text-right" />
              <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="bg-slate-50 border-none rounded-xl p-3 font-bold text-right" />
            </div>

            <textarea placeholder="הדבק כאן את רשימת המוצרים או פשוט תכתוב..." value={form.rawList} onChange={e => setForm({...form, rawList: e.target.value})} className="w-full h-32 bg-slate-50 border-none rounded-xl p-4 text-right font-bold resize-none" />
          </div>

          <Button onClick={submitOrder} disabled={loading} className="w-full h-16 bg-blue-600 rounded-2xl font-black text-xl border-none shadow-lg shadow-blue-200">
            {loading ? "שולח..." : "שלח הזמנה לסידור 🚀"}
          </Button>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto p-8 rounded-[2.5rem] shadow-2xl border-none space-y-8 text-center">
          <div className="flex justify-center"><CheckCircle2 size={64} className="text-green-500 animate-bounce"/></div>
          <h2 className="text-2xl font-black text-[#0B2C63]">הזמנתך התקבלה!</h2>
          
          <div className="bg-slate-50 p-6 rounded-2xl space-y-4 text-right border-r-8 border-blue-500">
            <p className="text-xs font-black text-slate-400 uppercase">סטטוס הזמנה נוכחי:</p>
            <div className="flex justify-between items-center">
              <Badge className="bg-blue-100 text-blue-700 border-none font-black px-4 py-2 text-lg">{orderStatus?.status || 'בטיפול'}</Badge>
              <div className="text-right">
                <p className="font-black text-slate-800">{orderStatus?.customer_name}</p>
                <p className="text-xs text-slate-400">מועד: {orderStatus?.scheduled_time}</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setStep(1)} variant="ghost" className="text-slate-400 font-bold border-none">הזמנה חדשה +</Button>
        </Card>
      )}
    </div>
  );
}
