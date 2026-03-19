"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Bell, Clock, Check, Trash2, Plus, 
  AlertTriangle, Share2, MessageSquare
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function DispatchStudio() {
    const [requests, setRequests] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const supabase = getSupabase();

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('dispatch_realtime')
            .on('postgres_changes', { event: 'INSERT', table: 'saban_requests' }, payload => {
                setRequests(prev => [payload.new, ...prev]);
                if (typeof window !== 'undefined' && (window as any).playNotificationSound) (window as any).playNotificationSound();
                toast.info("בקשה חדשה מאיציק!");
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchData = async () => {
        const { data: reqs } = await supabase.from('saban_requests').select('*').eq('status', 'pending');
        setRequests(reqs || []);
    };

    const approveRequest = async (req: any, driver: string) => {
        const { error } = await supabase.from('saban_requests').update({ status: 'approved', handled_by: driver }).eq('id', req.id);
        if (!error) {
            toast.success("עודכן בסידור!");
            setRequests(prev => prev.filter(r => r.id !== req.id));
            // כאן תוסיף לוגיקה להוספה לטבלת saban_orders אם תרצה
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#F1F5F9] p-6 gap-6 font-sans" dir="rtl">
            <Toaster position="top-center" richColors />
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-[#0B2C63] p-3 rounded-2xl text-white shadow-lg"><Truck size={32}/></div>
                    <h1 className="text-3xl font-black text-[#0B2C63]">SabanOS - סידור עבודה</h1>
                </div>
                <Button className="bg-white text-slate-800 rounded-2xl shadow-sm border-none font-bold gap-2">
                    <Share2 size={18}/> שיתוף סידור
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden">
                {/* מלשינון בקשות */}
                <Card className="md:col-span-1 p-6 rounded-[2.5rem] border-none shadow-xl bg-white flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                        <h2 className="font-black text-xl flex items-center gap-2 text-orange-600 animate-pulse">
                            <Bell size={24}/> בקשות חמות
                        </h2>
                        <Badge className="bg-orange-500 text-lg px-3">{requests.length}</Badge>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {requests.map(req => (
                            <div key={req.id} className="p-5 rounded-3xl bg-slate-50 border-r-8 border-orange-500 shadow-sm animate-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-black text-slate-800">{req.customer_name}</span>
                                    <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-full shadow-sm">
                                        {new Date(req.created_at).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 mb-4">{req.request_type} #{req.doc_number}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={() => approveRequest(req, 'חכמת')} size="sm" className="bg-[#0B2C63] rounded-xl font-bold">חכמת</Button>
                                    <Button onClick={() => approveRequest(req, 'עלי')} size="sm" className="bg-blue-600 rounded-xl font-bold">עלי</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* הלוח הראשי */}
                <Card className="md:col-span-3 p-8 rounded-[3rem] border-none shadow-xl bg-white overflow-y-auto">
                    <div className="space-y-2">
                        {Array.from({ length: 14 }, (_, i) => i + 6).map(hour => (
                            <div key={hour} className="flex gap-6 p-4 border-b border-slate-50 hover:bg-slate-50 transition-all rounded-2xl group">
                                <span className="font-black text-2xl text-[#0B2C63] w-20">{hour}:00</span>
                                <div className="flex-1 min-h-[60px] border-r-4 border-slate-100 pr-6 flex items-center gap-4">
                                    <Button variant="ghost" className="opacity-0 group-hover:opacity-100 bg-blue-50 text-blue-600 rounded-full h-10 w-10 p-0">
                                        <Plus size={24}/>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
