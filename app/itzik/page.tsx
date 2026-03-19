"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // שים לב לזה!
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, 
  Plus, Send, Loader2, ChevronDown, Copy, User, BellRing, Search
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ItzikSmartApp() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER' | 'HISTORY'>('HOME');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  
  const [form, setForm] = useState({
    customerName: '', docNum: '', notes: '', 
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30', endTime: '10:00',
    address: '', email: ''
  });

  const supabase = getSupabase();

  useEffect(() => {
    fetchRequests();
    if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
      (window as any).OneSignalDeferred.push((OneSignal: any) => OneSignal.login("itzik_zahavi"));
    }
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
    } else { setCustomerResults([]); }
  };

  const handleSend = async () => {
    if (!form.customerName || !form.docNum) return toast.error("חובה למלא לקוח ומספר מסמך");
    setLoading(true);
    const { error } = await supabase.from('saban_requests').insert([{
      request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
      customer_name: form.customerName, doc_number: form.docNum,
      notes: form.notes, delivery_date: form.date,
      time_window: `${form.startTime}-${form.endTime}`,
      extra_data: { address: form.address, email: form.email },
      status: 'pending', requester_name: 'איציק זהבי'
    }]);
    if (!error) { 
      toast.success("נשלח לסידור!"); 
      setMode('HOME'); 
      setForm({customerName:'', docNum:'', notes:'', date: new Date().toISOString().split('T')[0], startTime:'07:30', endTime:'10:00', address:'', email:''});
    }
    setLoading(false);
  };

  const cloneRequest = (req: any) => {
    setForm({
      ...form,
      customerName: req.customer_name,
      notes: req.notes,
      docNum: '',
      address: req.extra_data?.address || '',
      email: req.extra_data?.email || ''
    });
    setMode(req.request_type === 'הזמנה' ? 'ORDER' : 'TRANSFER');
  };

  const filteredHistory = requests.filter(r => 
    r.customer_name?.includes(historySearch) || r.doc_number?.includes(historySearch)
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24 text-right font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic">שלום איציק 👋</h1>
          <p className="text-slate-400 font-bold">SabanOS Mobile</p>
        </div>
        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center relative">
          <BellRing className="text-blue-600" size={20} />
          {requests.filter(r => r.status === 'pending').length > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
        </div>
      </div>

      {mode === 'HOME' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => setMode('ORDER')} className="p-8 cursor-pointer hover:scale-105 transition-all bg-[#0B2C63] text-white rounded-[2.5rem] shadow-xl border-none">
              <ShoppingCart size={40} className="mb-4 opacity-80" />
              <div className="font-black text-2xl text-white">הזמנה</div>
            </Card>
            <Card onClick={() => setMode('TRANSFER')} className="p-8 cursor-pointer hover:scale-105 transition-all bg-white text-[#0B2C63] rounded-[2.5rem] shadow-lg border-none">
              <ArrowLeftRight size={40} className="mb-4 text-[#0B2C63]" />
              <div className="font-black text-2xl text-[#0B2C63]">העברה</div>
            </Card>
          </div>

          <div className="flex justify-between items-center px-1">
            <h2 className="font-black text-xl">הבקשות שלי</h2>
            <Button variant="ghost" onClick={() => setMode('HISTORY')} className="text-blue-600 font-black">הכל</Button>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 3).map(req => (
              <Card key={req.id} className="p-4 rounded-3xl border-none shadow-sm bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {req.status === 'approved' ? <CheckCircle2 size={24}/> : <Clock size={24}/>}
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-800">{req.customer_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold">#{req.doc_number} • {req.request_type}</div>
                  </div>
                </div>
                <Badge className={req.status === 'approved' ? 'bg-green-500' : 'bg-orange-500 text-white'}>
                  {req.status === 'approved' ? 'אושר' : 'בטיפול'}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(mode === 'ORDER' || mode === 'TRANSFER') && (
        <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-2xl text-[#0B2C63]">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
            <X onClick={() => setMode('HOME')} className="cursor-pointer text-slate-400 bg-slate-50 p-1 rounded-full" />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">שם לקוח</label>
              <div className="relative">
                <User className="absolute right-4 top-4 text-slate-300" size={18} />
                <Input value={form.customerName} onChange={(e) => handleSearchCustomer(e.target.value)} placeholder="חפש שם..." className="h-14 pr-11 rounded-2xl bg-slate-50 border-none font-bold text-lg" />
              </div>
              {customerResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white shadow-xl rounded-2xl mt-1 border border-slate-100 overflow-hidden">
                  {customerResults.map(c => (
                    <div key={c.id} onClick={() => { setForm({...form, customerName: c.name}); setCustomerResults([]); }}
                         className="p-4 hover:bg-blue-50 cursor-pointer font-bold border-b last:border-none">
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase">מספר מסמך</label>
              <Input value={form.docNum} onChange={e => setForm({...form, docNum: e.target.value})} placeholder="חשבונית/הזמנה..." className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" />
            </div>

            <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <Button variant="ghost" onClick={() => setShowExtraFields(!showExtraFields)} className="w-full justify-between font-black text-xs text-slate-500">
                    <div className="flex items-center gap-2"><Plus size={16}/> הוסף כתובת/אימייל</div>
                    <ChevronDown size={16} className={showExtraFields ? 'rotate-180' : ''}/>
                </Button>
                {showExtraFields && (
                    <div className="p-2 space-y-3 animate-in fade-in">
                        <Input placeholder="כתובת למשלוח" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="bg-white rounded-xl h-11" />
                        <Input placeholder="אימייל לקוח" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-white rounded-xl h-11" />
                    </div>
                )}
            </div>

            <Button onClick={handleSend} disabled={loading} className="w-full h-16 bg-[#0B2C63] rounded-[2rem] font-black text-xl shadow-lg flex gap-3 text-white">
               {loading ? <Loader2 className="animate-spin" /> : <><Send size={24} /> שלח לסידור</>}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'HISTORY' && (
        <div className="space-y-4 animate-in fade-in">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl text-slate-800">חיפוש בהיסטוריה</h3>
              <X onClick={() => setMode('HOME')} className="cursor-pointer bg-white p-1 rounded-full shadow-sm text-slate-400" />
           </div>
           <div className="relative mb-6">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
              <Input placeholder="חפש לקוח או מסמך..." className="h-12 pr-12 rounded-2xl border-none shadow-sm bg-white font-bold" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
           </div>
           <div className="space-y-3">
             {filteredHistory.map(req => (
                <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-black text-slate-800 text-lg">{req.customer_name}</div>
                            <div className="text-xs text-slate-500 font-bold mb-2">{req.request_type} #{req.doc_number}</div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold">{req.status}</Badge>
                        </div>
                        <Button onClick={() => cloneRequest(req)} variant="outline" className="rounded-xl border-slate-100 gap-2 h-10 font-bold text-blue-600">
                          <Copy size={16}/> שכפל
                        </Button>
                    </div>
                </Card>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
