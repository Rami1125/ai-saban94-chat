"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Plus, UserCheck, Clock, Bell, Share2, 
  CheckCircle, UserPlus, Search, MessageSquare, AlertTriangle
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function DispatchStudio() {
    const [requests, setRequests] = useState<any[]>([]);
    const supabase = getSupabase();

    useEffect(() => {
        fetchPendingRequests();

        // האזנה לבקשות חדשות (מלשינון)
        const channel = supabase
            .channel('itizk_requests')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'saban_requests' }, payload => {
                setRequests(prev => [payload.new, ...prev]);
                // הפעלת צלצול מה-Layout
                if (typeof window !== 'undefined' && (window as any).playNotificationSound) {
                    (window as any).playNotificationSound();
                }
                toast.info(`בקשה חדשה מאיציק: ${payload.new.doc_number}`, {
                    icon: <Bell className="text-orange-500" />
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchPendingRequests = async () => {
        const { data } = await supabase
            .from('saban_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        setRequests(data || []);
    };

    const approveAndNotify = async (req: any, driver: string) => {
        const { error } = await supabase
            .from('saban_requests')
            .update({ status: 'approved', handled_by: driver })
            .eq('id', req.id);

        if (!error) {
            toast.success(`אושר ושויך ל${driver}`);
            setRequests(prev => prev.filter(r => r.id !== req.id));
            
            // שליחת התראה דרך OneSignal (מתוך ה-Window)
            if (typeof window !== 'undefined' && (window as any).OneSignal) {
                // כאן אפשר להוסיף לוגיקה לשליחת התראה ל-External ID של איציק
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 p-4 gap-4" dir="rtl">
            <Toaster position="top-center" richColors />
            
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-black text-[#0B2C63] flex items-center gap-2">
                    <Truck size={28}/> לוח בקשות וסידור
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
                        <Share2 size={18}/> שיתוף סידור
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
                {/* לוח בקשות איציק - מלשינון */}
                <Card className="md:col-span-1 p-4 flex flex-col gap-4 overflow-hidden border-2 border-orange-100 bg-orange-50/30 rounded-[2rem]">
                    <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                        <h2 className="font-black text-orange-700 flex items-center gap-2">
                            <Bell size={20} className="animate-bounce"/> בקשות מהשטח
                        </h2>
                        <Badge className="bg-orange-500">{requests.length}</Badge>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pl-2">
                        {requests.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-bold italic opacity-50">
                             <Clock size={40} className="mb-2"/>
                             אין בקשות ממתינות
                          </div>
                        ) : (
                          requests.map(req => (
                            <Card key={req.id} className="p-4 rounded-2xl border-none shadow-sm bg-white border-r-4 border-orange-500 animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-black text-slate-800 text-sm">{req.customer_name || 'לקוח מזדמן'}</span>
                                    <div className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                                        <Clock size={12}/>
                                        <Timer startTime={req.created_at} />
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 font-medium mb-3">
                                    {req.request_type} #{req.doc_number}
                                    {req.notes && <div className="mt-1 bg-slate-50 p-2 rounded-lg italic">"{req.notes}"</div>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={() => approveAndNotify(req, 'חכמת')} size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-bold h-8">שייך לחכמת</Button>
                                    <Button onClick={() => approveAndNotify(req, 'עלי')} size="sm" className="bg-slate-800 hover:bg-slate-900 rounded-xl text-[10px] font-bold h-8">שייך לעלי</Button>
                                </div>
                            </Card>
                          ))
                        )}
                    </div>
                </Card>

                {/* לוח הסידור המרכזי */}
                <Card className="md:col-span-3 p-6 rounded-[2rem] border-none shadow-sm bg-white overflow-y-auto">
                    <div className="space-y-1">
                        {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
                            <div key={hour} className="flex gap-4 p-3 border-b border-slate-50 hover:bg-slate-50/80 rounded-xl group transition-all">
                                <span className="font-black text-blue-600 w-12 text-lg">{hour}:00</span>
                                <div className="flex-1 min-h-[50px] border-r-2 border-slate-100 pr-4 flex items-center gap-3">
                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-500 p-2 rounded-lg">
                                        <Plus size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Timer({ startTime }: { startTime: string }) {
    const [ms, setMs] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setMs(Date.now() - new Date(startTime).getTime()), 1000);
        return () => clearInterval(i);
    }, [startTime]);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return <span>{mins}:{secs.toString().padStart(2, '0')}</span>;
}
