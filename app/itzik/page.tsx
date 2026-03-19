"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, Share2, User, AlertTriangle, Loader2 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ItzikLiveInterface() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER' | 'MY_REQUESTS'>('HOME');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    docNum: '', isUrgent: false, isReady: false, fromBranch: 'התלמיד', toBranch: 'החרש', time: '07:00'
  });

  const supabase = getSupabase();

  // מאזין בזמן אמת לעדכונים בבקשות של איציק
  useEffect(() => {
    // טעינה ראשונית
    supabase.from('saban_requests')
      .select('*')
      .eq('requester_name', 'איציק זהבי')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setMyRequests(data || []));

    // מאזין לשינויים בסטטוס (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'saban_requests', filter: 'requester_name=eq.איציק זהבי' },
        (payload) => {
          setMyRequests((prev) => prev.map(req => req.id === payload.new.id ? payload.new : req));
          if (payload.new.status === 'אושר') {
            toast.success(`בקשה ${payload.new.doc_number} אושרה ע"י ${payload.new.handled_by}!`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleSend = async () => {
    if (!formData.docNum) return toast.error("חסר מספר מסמך");
    setLoading(true);

    try {
      // שליחה לטבלה החדשה saban_requests
      const { error } = await supabase.from('saban_requests').insert([{
        requester_name: 'איציק זהבי',
        request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
        doc_number: formData.docNum,
        is_urgent: formData.isUrgent,
        is_ready: formData.isReady,
        from_branch: formData.fromBranch,
        to_branch: formData.toBranch,
        delivery_time: formData.time,
        delivery_date: new Date().toISOString().split('T')[0]
      }]);

      if (error) throw error;
      toast.success("בקשה נשלחה לסידור! 🚀");
      setMode('HOME');
    } catch (err) {
      toast.error("שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, handledBy: string | null) => {
    switch(status) {
      case 'ממתין': return <Badge variant="outline" className="animate-pulse">⏳ ממתין</Badge>;
      case 'אושר': return <Badge className="bg-green-100 text-green-800 border-none">✅ אושר ע"י {handledBy}</Badge>;
      case 'בוצע': return <Badge className="bg-blue-600 text-white border-none">🚚 בוצע</Badge>;
      default: return <Badge variant="destructive">❌ נדחה</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-sans pb-20" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="max-w-md mx-auto mb-8 flex flex-col items-center pt-6">
        <div className="w-24 h-24 rounded-full border-4 border-[#0B2C63] flex items-center justify-center bg-white shadow-xl mb-2">
            <User size={40} className="text-[#0B2C63]" />
        </div>
        <h1 className="text-2xl font-black text-[#0B2C63]">איציק זהבי</h1>
        <Button onClick={() => setMode('MY_REQUESTS')} variant="ghost" className="text-xs text-blue-600 font-bold">צפה בסטטוס בקשות (חי) ←</Button>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {mode === 'HOME' && (
          <div className="grid grid-cols-1 gap-6">
            <button onClick={() => setMode('ORDER')} className="h-40 bg-white border-b-8 border-blue-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <ShoppingCart size={44} className="text-blue-600" />
                <span className="text-xl font-black text-[#0B2C63]">הזמנה לסידור</span>
            </button>
            <button onClick={() => setMode('TRANSFER')} className="h-40 bg-white border-b-8 border-orange-500 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <ArrowLeftRight size={44} className="text-orange-500" />
                <span className="text-xl font-black text-[#0B2C63]">העברה לסניף</span>
            </button>
          </div>
        )}

        {(mode === 'ORDER' || mode === 'TRANSFER') && (
          <Card className="p-6 rounded-[2.5rem] shadow-2xl border-none">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-[#0B2C63]">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
                <button onClick={() => setMode('HOME')} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <Input placeholder={mode === 'ORDER' ? "מספר הזמנה" : "מספר העברה"} value={formData.docNum} onChange={e => setFormData({...formData, docNum: e.target.value})} className="h-14 rounded-2xl font-bold text-lg border-2" />
              <Button onClick={handleSend} disabled={loading} className="w-full h-16 bg-[#0B2C63] rounded-2xl font-black text-xl shadow-lg mt-4">
                {loading ? <Loader2 className="animate-spin" /> : "שלח בקשה 🚀"}
              </Button>
            </div>
          </Card>
        )}

        {mode === 'MY_REQUESTS' && (
          <div className="space-y-3 animate-in fade-in">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg">סטטוס בקשות אחרונות</h3>
                <Button onClick={() => setMode('HOME')} variant="ghost" className="p-0 h-8 w-8"><X size={16}/></Button>
             </div>
             {myRequests.map(req => (
                <Card key={req.id} className="p-4 rounded-2xl border-none shadow-md bg-white">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="font-black text-slate-800 text-sm">{req.request_type} #{req.doc_number}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{new Date(req.created_at).toLocaleString('he-IL')}</div>
                        </div>
                        {getStatusBadge(req.status, req.handled_by)}
                    </div>
                </Card>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
