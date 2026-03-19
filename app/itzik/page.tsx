"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, Copy, 
  Calendar as CalendarIcon, History, Send, AlertCircle, Bell
} from "lucide-react";
import { toast, Toaster } from "sonner"; // וודא שזה מיובא נכון
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ItzikSmartApp() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER' | 'HISTORY'>('HOME');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    docNum: '', notes: '', date: new Date().toISOString().split('T')[0],
    startTime: '07:30', endTime: '10:00', isUrgent: false,
    fromBranch: 'התלמיד', toBranch: 'החרש'
  });

  const supabase = getSupabase();

  useEffect(() => {
    fetchRequests();
    
    // מאזין לשינויים בזמן אמת
    const channel = supabase.channel('itzik_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, (payload) => {
        if (payload.new && (payload.new as any).status === 'approved') {
          toast.success("בקשה אושרה!", { icon: <Bell className="text-green-500"/> });
        }
        fetchRequests();
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const fetchRequests = async () => {
    const { data } = await supabase.from('saban_requests')
      .select('*').order('created_at', { ascending: false }).limit(10);
    setRequests(data || []);
  };

  const handleSend = async () => {
    if (!form.docNum) return toast.error("חובה להזין מספר מסמך");
    setLoading(true);

    const payload = {
      request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
      doc_number: form.docNum,
      notes: form.notes,
      delivery_date: form.date,
      time_window: `${form.startTime} - ${form.endTime}`,
      status: 'pending',
      requester_name: 'איציק זהבי',
      from_branch: form.fromBranch,
      to_branch: form.toBranch,
      customer_name: mode === 'ORDER' ? 'חנות' : `העברה: ${form.fromBranch}` // שדה חובה בטבלה
    };

    const { error } = await supabase.from('saban_requests').insert([payload]);
    
    if (!error) {
      toast.success("הבקשה נשלחה לסידור 🔥");
      setMode('HOME');
      setForm({...form, docNum: '', notes: ''});
      fetchRequests();
    } else {
      console.error(error);
      toast.error("שגיאה בשליחה. בדוק SQL");
    }
    setLoading(false);
  };

  const cloneRequest = (req: any) => {
    setForm({
      ...form,
      fromBranch: req.from_branch,
      toBranch: req.to_branch,
      notes: req.notes,
      docNum: '' 
    });
    setMode(req.request_type === 'הזמנה' ? 'ORDER' : 'TRANSFER');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">שלום איציק 👋</h1>
          <p className="text-slate-500 font-bold">מה נבצע היום?</p>
        </div>
        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
          <Bell className="text-slate-400" size={20} />
        </div>
      </div>

      {mode === 'HOME' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => setMode('ORDER')} className="p-6 cursor-pointer hover:ring-2 ring-blue-500 transition-all border-none shadow-sm bg-blue-600 text-white rounded-3xl">
              <ShoppingCart size={32} className="mb-4 opacity-80" />
              <div className="font-black text-xl text-right">הזמנה חדשה</div>
            </Card>
            <Card onClick={() => setMode('TRANSFER')} className="p-6 cursor-pointer hover:ring-2 ring-blue-500 transition-all border-none shadow-sm bg-white rounded-3xl">
              <ArrowLeftRight size={32} className="mb-4 text-blue-600" />
              <div className="font-black text-xl text-slate-800 text-right">העברה</div>
            </Card>
          </div>

          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg text-slate-800">מעקב בקשות</h2>
              <Button variant="ghost" onClick={() => setMode('HISTORY')} className="text-blue-600 font-bold">הכל</Button>
            </div>
            <div className="space-y-3">
              {requests.slice(0, 3).map(req => (
                <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className={`p-2 rounded-xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {req.status === 'approved' ? <CheckCircle2 size={20}/> : <Clock size={20}/>}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-sm text-right">{req.request_type} #{req.doc_number}</div>
                      <div className="text-[10px] text-slate-400 font-bold text-right">
                        לפני {formatDistanceToNow(new Date(req.created_at), { locale: he })}
                      </div>
                    </div>
                  </div>
                  <Badge className={req.status === 'approved' ? 'bg-green-500 border-none' : 'bg-slate-100 text-slate-500 border-none'}>
                    {req.status === 'approved' ? 'אושר' : 'ממתין'}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {(mode === 'ORDER' || mode === 'TRANSFER') && (
        <Card className="p-6 rounded-3xl border-none shadow-xl bg-white animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-xl">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
            <X onClick={() => setMode('HOME')} className="cursor-pointer text-slate-400 bg-slate-50 p-1 rounded-full" />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 mb-1 block uppercase text-right">מספר מסמך</label>
              <Input 
                value={form.docNum}
                onChange={(e) => setForm({...form, docNum: e.target.value})}
                placeholder="הקלד מספר..." className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-lg text-right" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase text-right">תאריך</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="rounded-xl border-slate-100 font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase text-right">שעה</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="rounded-xl border-slate-100 font-bold" />
              </div>
            </div>

            {mode === 'TRANSFER' && (
               <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed">
                  <span className="font-bold text-xs text-slate-500">{form.fromBranch} ⬅️ {form.toBranch}</span>
                  <Button onClick={() => setForm({...form, fromBranch: form.toBranch, toBranch: form.fromBranch})} variant="ghost" className="h-8 w-8 p-0"><ArrowLeftRight size={14}/></Button>
               </div>
            )}

            <div>
              <label className="text-xs font-black text-slate-400 mb-1 block uppercase text-right">הערות</label>
              <Textarea 
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="דגשים לסידור..." className="rounded-2xl border-slate-100 bg-slate-50 font-medium h-24 text-right" 
              />
            </div>

            <Button 
              onClick={handleSend}
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xl shadow-lg shadow-blue-100"
            >
              {loading ? "שולח..." : "שלח בקשה לסידור 🚀"}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'HISTORY' && (
        <div className="space-y-3 animate-in fade-in">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg">כל הבקשות</h3>
              <X onClick={() => setMode('HOME')} className="cursor-pointer" />
           </div>
           {requests.map(req => (
              <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white">
                  <div className="flex justify-between items-start">
                      <div className="text-right">
                          <div className="font-black text-slate-800">{req.request_type} #{req.doc_number}</div>
                          <div className="text-xs text-slate-400 font-bold">{req.delivery_date} | {req.time_window}</div>
                      </div>
                      <Button onClick={() => cloneRequest(req)} size="sm" variant="outline" className="rounded-xl border-slate-100 gap-2">
                        <Copy size={14}/> שכפל
                      </Button>
                  </div>
              </Card>
           ))}
        </div>
      )}
    </div>
  );
}
