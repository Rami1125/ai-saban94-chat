"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, Send, Bell, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ItzikSmartApp() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER'>('HOME');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    docNum: '', notes: '', date: new Date().toISOString().split('T')[0],
    startTime: '07:30', endTime: '10:00', fromBranch: 'התלמיד', toBranch: 'החרש'
  });

  const supabase = getSupabase();

  useEffect(() => {
    fetchRequests();
    const channel = supabase.channel('itzik_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('saban_requests').select('*').order('created_at', { ascending: false }).limit(5);
    setRequests(data || []);
  };

  const handleSend = async () => {
    if (!form.docNum) return toast.error("חובה להזין מספר מסמך");
    setLoading(true);

    // בניית האובייקט בדיוק לפי עמודות ה-SQL
    const payload = {
      request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
      doc_number: form.docNum,
      notes: form.notes,
      delivery_date: form.date,
      time_window: `${form.startTime} - ${form.endTime}`,
      from_branch: form.fromBranch,
      to_branch: form.toBranch,
      customer_name: mode === 'ORDER' ? 'לקוח חנות' : 'העברה סניף',
      requester_name: 'איציק זהבי',
      status: 'pending'
    };

    const { error } = await supabase.from('saban_requests').insert([payload]);
    
    if (!error) {
      toast.success("נשלח לסידור! 🚀");
      setMode('HOME');
      setForm({...form, docNum: '', notes: ''});
    } else {
      console.error("Supabase Error:", error);
      toast.error("שגיאה בשמירה. וודא שהרצת את ה-SQL ב-Supabase");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24 text-right font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header איציק */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic">שלום איציק 👋</h1>
          <p className="text-slate-500 font-bold">SabanOS - בקשות חנות</p>
        </div>
        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center relative">
          <Bell className="text-blue-600" size={20} />
          {requests.some(r => r.status === 'pending') && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
        </div>
      </div>

      {mode === 'HOME' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => setMode('ORDER')} className="p-8 cursor-pointer bg-blue-600 text-white rounded-[2.5rem] shadow-xl border-none active:scale-95 transition-all">
              <ShoppingCart size={40} className="mb-4 opacity-80 text-white" />
              <div className="font-black text-2xl">הזמנה</div>
            </Card>
            <Card onClick={() => setMode('TRANSFER')} className="p-8 cursor-pointer bg-white text-blue-600 rounded-[2.5rem] shadow-lg border-none active:scale-95 transition-all text-right">
              <ArrowLeftRight size={40} className="mb-4 text-blue-600" />
              <div className="font-black text-2xl">העברה</div>
            </Card>
          </div>

          <h2 className="font-black text-xl px-1">מעקב אחרון</h2>
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-3xl border-none shadow-sm bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {req.status === 'approved' ? <CheckCircle2 size={24}/> : <Clock size={24}/>}
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm">{req.request_type} #{req.doc_number}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{req.status === 'approved' ? 'אושר לסידור' : 'ממתין לטיפול'}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-2xl text-[#0B2C63]">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
            <X onClick={() => setMode('HOME')} className="cursor-pointer text-slate-400 bg-slate-50 p-1 rounded-full" />
          </div>
          <div className="space-y-4">
            <Input value={form.docNum} onChange={e => setForm({...form, docNum: e.target.value})} placeholder="מספר מסמך (חשבונית/הזמנה)..." className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg text-right" />
            
            {mode === 'TRANSFER' && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed">
                 <span className="font-bold text-xs text-slate-500">{form.fromBranch} ⬅️ {form.toBranch}</span>
                 <Button onClick={() => setForm({...form, fromBranch: form.toBranch, toBranch: form.fromBranch})} variant="ghost" className="h-8 w-8 p-0"><ArrowLeftRight size={14}/></Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-right">
                <div>
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">שעת התחלה</label>
                    <Input type="time" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="h-12 rounded-xl border-slate-100 font-bold" />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">תאריך</label>
                    <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-12 rounded-xl border-slate-100 font-bold" />
                </div>
            </div>
            <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="הערות לסידור (דחיפות, הערות נהג)..." className="rounded-2xl border-slate-100 bg-slate-50 font-medium h-24 text-right" />
            <Button onClick={handleSend} disabled={loading} className="w-full h-16 bg-[#0B2C63] rounded-[2rem] font-black text-xl shadow-lg">
                {loading ? <Loader2 className="animate-spin" /> : "שלח בקשה 🚀"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
