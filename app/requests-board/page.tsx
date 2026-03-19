"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, 
  X, Share2, UserCheck, AlertTriangle, Play 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// זיהוי המטפל (לצורך המלשינון)
const CURRENT_HANDLER = 'ראמי'; 

export default function DispatchRequestsBoard() {
  const [requests, setRequests] = useState<any[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    // טעינת בקשות ממתינות
    supabase.from('saban_requests')
      .select('*')
      .eq('status', 'ממתין')
      .order('is_urgent', { ascending: false }) // דחוף קודם
      .order('created_at', { ascending: true }) // ישן קודם
      .then(({ data }) => setRequests(data || []));

    // האזנה Realtime לבקשות חדשות (כדי שראמי יראה אותן מיד)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'saban_requests', filter: 'status=eq.ממתין' },
        (payload) => {
          setRequests((prev) => [payload.new, ...prev]);
          toast.info(`בקשה חדשה מ${payload.new.requester_name}!`);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // פונקציית אישור (מעדכנת סטטוס, מטפל, וטיימר מלשינון)
  const approveRequest = async (request: any) => {
    try {
      const { error } = await supabase.from('saban_requests')
        .update({
          status: 'אושר',
          handled_by: CURRENT_HANDLER,
          time_stamp_approved: new Date().toISOString() // תיעוד זמן אישור
        })
        .eq('id', request.id);

      if (error) throw error;
      toast.success("בקשה אושמרה והועברה לסידור!");
      setRequests((prev) => prev.filter(req => req.id !== request.id));

      // שיתוף אוטומטי לערוץ וואטסאפ (תבנית מעוצבת)
      shareToChannel(request);

    } catch (err) {
      toast.error("שגיאה בעדכון הסטטוס");
    }
  };

  const shareToChannel = (req: any) => {
    const urgency = req.is_urgent ? "🚨 *דחוף!*" : "🟢 רגיל";
    const msg = `*📦 כרטיס משימה - אושר לסידור*\n` +
                `---------------------------\n` +
                `👤 *המבקש:* ${req.requester_name}\n` +
                `🔹 *סוג:* ${req.request_type}\n` +
                `🔢 *מספר:* ${req.doc_number}\n` +
                `🚦 *דחיפות:* ${urgency}\n` +
                `✍️ *טופל ע"י:* ${CURRENT_HANDLER}\n` +
                `⏱️ *זמן תגובה:* ${calculateSLA(req.created_at)} דקות\n` +
                `---------------------------\n` +
                `_המשימה חיה עד לעדכון תעודת משלוח_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const calculateSLA = (createdAt: string) => {
    const start = new Date(createdAt);
    const end = new Date(); // עכשיו (זמן האישור)
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / 60000); // המרה לדקות
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-2xl shadow-xl mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-black text-white">לוח בקשות חנות (חי)</h1>
            <p className="text-xs text-blue-200 font-bold">ממתין לטיפול של {CURRENT_HANDLER}</p>
        </div>
        <div className="text-3xl font-black animate-pulse text-green-400">{requests.length}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto">
        {requests.map(req => (
            <Card key={req.id} className={`p-5 rounded-2xl shadow-lg bg-white relative overflow-hidden ${req.is_urgent ? 'border-r-8 border-red-600' : 'border-none'}`}>
                {req.is_urgent && <AlertTriangle className="absolute top-3 left-3 text-red-600 animate-pulse" size={24}/>}
                
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center bg-slate-50">
                        {req.request_type === 'הזמנה' ? <ShoppingCart className="text-blue-600"/> : <ArrowLeftRight className="text-orange-500"/>}
                    </div>
                    <div>
                        <div className="font-black text-slate-800 text-lg">{req.request_type} #{req.doc_number}</div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10}/> נתקבל: {new Date(req.created_at).toLocaleString('he-IL')} (לפני {calculateSLA(req.created_at)} דקות)</div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <Badge variant="secondary" className="font-bold text-xs gap-1"><UserCheck size={12}/> מבקש: {req.requester_name}</Badge>
                    <div className="flex gap-2">
                        <Button onClick={() => approveRequest(req)} className="bg-green-600 hover:bg-green-500 rounded-xl font-black gap-2 h-10 text-xs">
                            <Play size={16} /> אישור + שיתוף 🚀
                        </Button>
                    </div>
                </div>
            </Card>
        ))}
      </div>
    </div>
  );
}
