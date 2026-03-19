"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, 
  User, Plus, Send, Loader2, Search, MapPin, Mail, ChevronDown, Copy
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ItzikSmartApp() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER' | 'HISTORY'>('HOME');
  const [loading, setLoading] = useState(false);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    customerName: '', docNum: '', notes: '', 
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30', endTime: '10:00',
    address: '', email: ''
  });

  const supabase = getSupabase();

  useEffect(() => {
    // הרשמה ל-OneSignal
    if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
      (window as any).OneSignalDeferred.push((OneSignal: any) => {
        OneSignal.login("itzik_zahavi");
      });
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('saban_requests').select('*').order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleSearchCustomer = async (val: string) => {
    setForm({...form, customerName: val});
    if (val.length > 2) {
      const { data } = await supabase.from('customers').select('*').ilike('name', `%${val}%`).limit(5);
      setCustomerResults(data || []);
    } else {
      setCustomerResults([]);
    }
  };

  const handleSend = async () => {
    if (!form.customerName || !form.docNum) return toast.error("מלא שם לקוח ומספר מסמך");
    setLoading(true);
    const { error } = await supabase.from('saban_requests').insert([{
      request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
      customer_name: form.customerName,
      doc_number: form.docNum,
      notes: form.notes,
      delivery_date: form.date,
      time_window: `${form.startTime}-${form.endTime}`,
      extra_data: { address: form.address, email: form.email },
      status: 'pending',
      requester_name: 'איציק זהבי'
    }]);

    if (!error) {
      toast.success("הבקשה נשלחה!");
      setMode('HOME');
      setForm({customerName:'', docNum:'', notes:'', date: new Date().toISOString().split('T')[0], startTime:'07:30', endTime:'10:00', address:'', email:''});
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header הקיים עם שדרוג */}
      <div className="flex justify-between items-center mb-8 pt-6">
        <div>
          <h1 className="text-3xl font-black text-[#0B2C63]">איציק זהבי</h1>
          <p className="text-slate-400 font-bold">מערכת בקשות SabanOS</p>
        </div>
        <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
          <Badge className="bg-blue-600 animate-pulse">Live</Badge>
        </div>
      </div>

      {mode === 'HOME' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => setMode('ORDER')} className="p-8 cursor-pointer hover:scale-95 transition-all bg-[#0B2C63] text-white rounded-[2.5rem] shadow-xl border-none">
              <ShoppingCart size={40} className="mb-4 opacity-80" />
              <div className="font-black text-2xl">הזמנה</div>
            </Card>
            <Card onClick={() => setMode('TRANSFER')} className="p-8 cursor-pointer hover:scale-95 transition-all bg-white text-[#0B2C63] rounded-[2.5rem] shadow-lg border-none">
              <ArrowLeftRight size={40} className="mb-4" />
              <div className="font-black text-2xl">העברה</div>
            </Card>
          </div>

          <div className="flex justify-between items-center px-2">
            <h2 className="font-black text-xl text-slate-800">מעקב שלי</h2>
            <Button variant="ghost" onClick={() => setMode('HISTORY')} className="text-blue-600 font-black">הכל</Button>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 3).map(req => (
              <Card key={req.id} className="p-4 rounded-3xl border-none shadow-sm bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {req.status === 'approved' ? <CheckCircle2 size={24}/> : <Clock size={24}/>}
                  </div>
                  <div>
                    <div className="font-black text-slate-800">{req.customer_name}</div>
                    <div className="text-xs text-slate-400 font-bold">{req.request_type} #{req.doc_number}</div>
                  </div>
                </div>
                <Badge className={req.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'}>
                  {req.status === 'approved' ? 'אושר' : 'בטיפול'}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(mode === 'ORDER' || mode === 'TRANSFER') && (
        <Card className="p-8 rounded-[3rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-black text-3xl text-[#0B2C63]">{mode === 'ORDER' ? 'חדשה' : 'העברה'}</h2>
            <X onClick={() => setMode('HOME')} className="cursor-pointer text-slate-300 hover:text-red-500 transition-colors" size={32} />
          </div>

          <div className="space-y-5">
            <div className="relative">
              <label className="text-xs font-black text-slate-400 mr-2 block mb-1">לקוח</label>
              <Input 
                value={form.customerName}
                onChange={(e) => handleSearchCustomer(e.target.value)}
                placeholder="חפש לקוח..."
                className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-xl pr-6"
              />
              {customerResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white shadow-2xl rounded-2xl mt-2 border border-slate-100">
                  {customerResults.map(c => (
                    <div key={c.id} onClick={() => { setForm({...form, customerName: c.name}); setCustomerResults([]); }}
                         className="p-4 hover:bg-blue-50 cursor-pointer font-black border-b last:border-none">
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 mr-2 block mb-1">מספר מסמך</label>
              <Input 
                value={form.docNum}
                onChange={(e) => setForm({...form, docNum: e.target.value})}
                placeholder="הקלד מספר..."
                className="h-16 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-xl pr-6"
              />
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-2 border border-slate-100">
                <Button variant="ghost" onClick={() => setShowExtraFields(!showExtraFields)} className="w-full justify-between font-black text-slate-500">
                    <div className="flex items-center gap-2"><Plus size={20}/> פרטי קשר וכתובת</div>
                    <ChevronDown size={20} className={showExtraFields ? 'rotate-180' : ''}/>
                </Button>
                {showExtraFields && (
                    <div className="p-4 space-y-4 animate-in fade-in">
                        <Input placeholder="כתובת למשלוח" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-white rounded-xl h-12" />
                        <Input placeholder="אימייל לקוח" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white rounded-xl h-12" />
                    </div>
                )}
            </div>

            <Textarea 
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="הערות לסידור..."
                className="rounded-2xl bg-slate-50 border-none h-24 font-bold p-4"
            />

            <Button onClick={handleSend} disabled={loading} className="w-full h-20 bg-[#0B2C63] rounded-[2rem] font-black text-2xl shadow-xl active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <><Send className="ml-2" /> שלח בקשה</>}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
