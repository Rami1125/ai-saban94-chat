"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, Copy, 
  Search, User, Mail, MapPin, ChevronDown, Plus, Loader2, 
  History, BellRing, Send, Phone
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ItzikSmartApp() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER' | 'HISTORY'>('HOME');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  
  const [form, setForm] = useState({
    customerName: '',
    docNum: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:30',
    endTime: '10:00',
    email: '',
    address: '',
    fromBranch: 'התלמיד',
    toBranch: 'החרש'
  });

  const supabase = getSupabase();

  // 1. חיבור משתמש ל-OneSignal וטעינת נתונים
  useEffect(() => {
    // רישום המשתמש ב-OneSignal לזיהוי אישי
    if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(function(OneSignal: any) {
            OneSignal.login("itzik_zahavi"); // מזהה קבוע לאיציק
        });
    }

    fetchRequests();

    // מאזין לשינויי סטטוס (Realtime) + צלצול
    const channel = supabase.channel('itzik_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, (payload) => {
        if (payload.new && (payload.new as any).status === 'approved') {
          (window as any).playNotificationSound?.();
          toast.success("הבקשה שלך אושרה עכשיו! 🎉");
        }
        fetchRequests();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. חיפוש לקוח תוך כדי הקלדה
  useEffect(() => {
    const searchCustomer = async () => {
      if (form.customerName.length > 2) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .ilike('name', `%${form.customerName}%`)
          .limit(4);
        setCustomerResults(data || []);
      } else {
        setCustomerResults([]);
      }
    };
    const debounce = setTimeout(searchCustomer, 300);
    return () => clearTimeout(debounce);
  }, [form.customerName]);

  const fetchRequests = async () => {
    const { data } = await supabase.from('saban_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleSend = async () => {
    if (!form.docNum || !form.customerName) {
        return toast.error("חובה למלא שם לקוח ומספר מסמך");
    }
    setLoading(true);
    const payload = {
      request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
      customer_name: form.customerName,
      doc_number: form.docNum,
      notes: form.notes,
      delivery_date: form.date,
      time_window: `${form.startTime} - ${form.endTime}`,
      extra_data: { email: form.email, address: form.address },
      status: 'pending',
      requester_name: 'איציק זהבי'
    };

    const { error } = await supabase.from('saban_requests').insert([payload]);
    if (!error) {
      toast.success("הבקשה נשלחה לסידור!");
      setMode('HOME');
      resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      customerName: '', docNum: '', notes: '', 
      date: new Date().toISOString().split('T')[0],
      startTime: '07:30', endTime: '10:00', 
      email: '', address: '', fromBranch: 'התלמיד', toBranch: 'החרש'
    });
    setShowExtraFields(false);
  };

  const cloneRequest = (req: any) => {
    setForm({
      ...form,
      customerName: req.customer_name,
      notes: req.notes,
      docNum: '', // מאפס מספר מסמך לשכפול
      address: req.extra_data?.address || '',
      email: req.extra_data?.email || ''
    });
    setMode(req.request_type === 'הזמנה' ? 'ORDER' : 'TRANSFER');
  };

  // פילטר להיסטוריה
  const filteredHistory = requests.filter(r => 
    r.customer_name?.includes(historySearch) || r.doc_number?.includes(historySearch)
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-4 pb-24 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">שלום, איציק 🛠️</h1>
          <p className="text-slate-500 font-bold">מערכת בקשות SabanOS</p>
        </div>
        <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100 relative">
          <BellRing className="text-blue-600" size={20} />
          {requests.filter(r => r.status === 'pending').length > 0 && (
             <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
      </div>

      {mode === 'HOME' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => setMode('ORDER')} className="p-6 cursor-pointer hover:scale-105 transition-all border-none shadow-sm bg-blue-600 text-white rounded-[2.5rem]">
              <ShoppingCart size={32} className="mb-4 opacity-80" />
              <div className="font-black text-xl">הזמנה חדשה</div>
            </Card>
            <Card onClick={() => setMode('TRANSFER')} className="p-6 cursor-pointer hover:scale-105 transition-all border-none shadow-sm bg-white rounded-[2.5rem]">
              <ArrowLeftRight size={32} className="mb-4 text-blue-600" />
              <div className="font-black text-xl text-slate-800">העברה</div>
            </Card>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg text-slate-800">בקשות אחרונות</h2>
              <Button variant="ghost" onClick={() => setMode('HISTORY')} className="text-blue-600 font-bold">צפה בהכל</Button>
            </div>
            <div className="space-y-3">
              {requests.slice(0, 4).map(req => (
                <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className={`p-2 rounded-xl ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {req.status === 'approved' ? <CheckCircle2 size={20}/> : <Clock size={20}/>}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-sm">{req.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        {req.request_type} #{req.doc_number} • לפני {formatDistanceToNow(new Date(req.created_at), { locale: he })}
                      </div>
                    </div>
                  </div>
                  <Badge className={`rounded-lg ${req.status === 'approved' ? 'bg-green-500' : 'bg-orange-400'}`}>
                    {req.status === 'approved' ? 'אושר' : 'בטיפול'}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {(mode === 'ORDER' || mode === 'TRANSFER') && (
        <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl bg-white animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-2xl">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
            <X onClick={() => setMode('HOME')} className="cursor-pointer text-slate-400 bg-slate-100 p-1 rounded-full" />
          </div>
          
          <div className="space-y-4">
            {/* שדה שם לקוח עם זיהוי */}
            <div className="relative">
              <label className="text-xs font-black text-slate-400 mb-1 block uppercase mr-2">שם לקוח</label>
              <div className="relative">
                <User className="absolute right-4 top-4 text-slate-300" size={20} />
                <Input 
                  value={form.customerName}
                  onChange={(e) => setForm({...form, customerName: e.target.value})}
                  placeholder="הקלד שם לקוח..." 
                  className="h-14 pr-12 rounded-2xl border-slate-100 bg-slate-50 font-bold text-lg focus:ring-2 ring-blue-100" 
                />
              </div>
              {customerResults.length > 0 && (
                <div className="absolute z-50 w-full bg-white shadow-xl rounded-2xl mt-2 border border-slate-100 overflow-hidden">
                  {customerResults.map(c => (
                    <div key={c.id} onClick={() => { setForm({...form, customerName: c.name}); setCustomerResults([]); }}
                         className="p-4 hover:bg-blue-50 cursor-pointer font-bold border-b last:border-none flex justify-between items-center">
                      {c.name} <Plus size={16} className="text-blue-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 mb-1 block uppercase mr-2">מספר מסמך</label>
              <Input 
                value={form.docNum}
                onChange={(e) => setForm({...form, docNum: e.target.value})}
                placeholder="מספר הזמנה/חשבונית..." 
                className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold text-lg" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase mr-2">תאריך</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="h-12 rounded-xl border-slate-100 font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase mr-2">שעת התחלה</label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="h-12 rounded-xl border-slate-100 font-bold" />
              </div>
            </div>

            {/* שדות דינמיים - המבורגר הוספה */}
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                <Button variant="ghost" onClick={() => setShowExtraFields(!showExtraFields)} className="w-full h-12 justify-between px-4 hover:bg-slate-100 transition-colors">
                    <span className="font-black text-sm flex items-center gap-2 text-slate-600">
                        <Plus size={18} className={showExtraFields ? 'rotate-45' : ''} /> 
                        הוסף פרטי קשר/כתובת
                    </span>
                    <ChevronDown size={18} className={showExtraFields ? 'rotate-180' : ''} />
                </Button>
                {showExtraFields && (
                    <div className="p-4 space-y-3 bg-white border-t border-slate-100 animate-in slide-in-from-top-2">
                        <div className="flex gap-2 items-center">
                            <MapPin size={18} className="text-slate-300" />
                            <Input placeholder="כתובת מלאה למשלוח..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="flex gap-2 items-center">
                            <Mail size={18} className="text-slate-300" />
                            <Input placeholder="אימייל לקוח (לשליחת מסמכים)..." value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" />
                        </div>
                    </div>
                )}
            </div>

            <Textarea 
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="הערות ודגשים מיוחדים..." 
              className="rounded-2xl border-slate-100 bg-slate-50 font-medium h-20" 
            />

            <Button 
              onClick={handleSend}
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={24} /> שלח לסידור</>}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'HISTORY' && (
        <div className="space-y-4 animate-in fade-in">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl text-slate-800">היסטוריה וחיפוש</h3>
              <X onClick={() => setMode('HOME')} className="cursor-pointer bg-white p-1 rounded-full shadow-sm" />
           </div>

           <div className="relative mb-6">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={20} />
              <Input 
                placeholder="חפש לפי לקוח או מספר מסמך..." 
                className="h-12 pr-12 rounded-2xl border-none shadow-sm bg-white font-bold"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
           </div>

           <div className="space-y-3">
             {filteredHistory.map(req => (
                <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-black text-slate-800 text-lg">{req.customer_name}</div>
                            <div className="text-xs text-slate-500 font-bold mb-2">{req.request_type} #{req.doc_number} | {req.delivery_date}</div>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold">{req.status}</Badge>
                        </div>
                        <Button onClick={() => cloneRequest(req)} variant="outline" className="rounded-xl border-slate-100 gap-2 h-10 font-bold text-blue-600">
                          <Copy size={16}/> שכפל
                        </Button>
                    </div>
                </Card>
             ))}
             {filteredHistory.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-bold">לא נמצאו תוצאות לחיפוש</div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
