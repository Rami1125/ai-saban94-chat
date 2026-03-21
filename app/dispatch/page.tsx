"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Bell, CheckCircle2, XCircle, Clock, 
  ExternalLink, MessageSquare, AlertCircle, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function SabanDispatchDashboard() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  const fetchData = async () => {
    setLoading(true);
    const { data: clients } = await supabase.from('saban_customers').select('*');
    const { data: reqs } = await supabase.from('saban_customer_requests').select('*').eq('status', 'pending');
    setCustomers(clients || []);
    setRequests(reqs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // מאזין בזמן אמת לבקשות חדשות מלקוחות
    const channel = supabase.channel('dispatch_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_customer_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            new Audio('/sounds/gentle-bell.mp3').play().catch(() => {});
            toast.success("בקשה חדשה נכנסה מלקוח!");
        }
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const approveRequest = async (reqId: string, customerId: string) => {
    // לוגיקה לאישור: מעדכן סטטוס בקשה ויוצר הזמנה חדשה בסידור
    const { error } = await supabase.from('saban_customer_requests').update({ status: 'approved' }).eq('id', reqId);
    if (!error) {
        toast.success("הבקשה אושרה והועברה לסידור העבודה!");
        fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-6 lg:p-10 text-right" dir="rtl">
      <Toaster position="top-left" richColors />
      
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-black italic text-blue-800 tracking-tighter">SabanOS Dispatch</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">מערכת שליטה בלקוחות ובקשות חי</p>
        </div>
        <div className="flex gap-4">
            <Badge className="bg-white text-blue-600 border-none px-4 py-2 shadow-sm font-black italic">
                {customers.length} לקוחות במאגר
            </Badge>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full text-center py-20"><Loader2 className="animate-spin text-blue-600 mx-auto" size={48}/></div>
        ) : customers.map(client => {
            const clientReq = requests.find(r => r.customer_id === client.customer_id);
            return (
                <Card key={client.id} className={`relative p-8 rounded-[2.5rem] border-none shadow-sm transition-all duration-500 overflow-hidden ${clientReq ? 'bg-green-50 ring-4 ring-green-400 animate-pulse' : 'bg-white hover:shadow-xl'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${clientReq ? 'bg-green-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                            <Users size={28}/>
                        </div>
                        {clientReq && (
                            <div className="flex flex-col items-end">
                                <Badge className="bg-green-600 text-white animate-bounce mb-2">בקשה חדשה!</Badge>
                                <span className="text-[10px] font-black text-green-700 italic flex items-center gap-1"><Clock size={10}/> לפני דקה</span>
                            </div>
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-slate-800 mb-2 italic tracking-tight">{client.full_name}</h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">{client.address}</p>

                    {clientReq ? (
                        <div className="bg-white/50 p-4 rounded-2xl border border-green-200 space-y-4">
                            <p className="text-xs font-black text-green-800">פעולה מבוקשת: <span className="underline">{clientReq.action_type}</span></p>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => approveRequest(clientReq.id, client.customer_id)}
                                    className="flex items-center justify-center gap-2 bg-green-600 text-white p-3 rounded-xl font-black text-xs hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                                >
                                    <CheckCircle2 size={16}/> אשר
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white text-slate-400 p-3 rounded-xl font-black text-xs border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-all">
                                    <XCircle size={16}/> דחה
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button className="flex-1 bg-slate-50 text-slate-600 p-3 rounded-xl font-black text-[10px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                <MessageSquare size={14}/> צאט לקוח
                            </button>
                            <button className="flex-1 bg-slate-50 text-slate-600 p-3 rounded-xl font-black text-[10px] hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 text-center">
                                <ExternalLink size={14}/> תיק מלא
                            </button>
                        </div>
                    )}
                </Card>
            );
        })}
      </div>
    </div>
  );
}
