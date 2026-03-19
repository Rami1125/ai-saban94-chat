"use client";
import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Truck, Plus, UserCheck, Clock, Bell, Share2, 
  PlayCircle, CheckCircle, UserPlus, Search 
} from "lucide-react";
import { toast, Toaster } from "sonner";
import OneSignal from 'react-onesignal';

export default function DispatchStudio() {
    const [requests, setRequests] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const supabase = getSupabase();

    useEffect(() => {
        // אתחול התראות OneSignal
        OneSignal.init({ appId: "YOUR_ONESIGNAL_APP_ID" });

        // האזנה לבקשות חדשות מאיציק
        const channel = supabase
            .channel('itizk_requests')
            .on('postgres_changes', { event: 'INSERT', table: 'saban_requests' }, payload => {
                setRequests(prev => [payload.new, ...prev]);
                if (audioRef.current) audioRef.current.play();
                toast.success("בקשה חדשה מאיציק!");
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const assignToDriver = async (request: any, driverName: string) => {
        const { error } = await supabase
            .from('saban_requests')
            .update({ status: 'מאושר', handled_by: driverName })
            .eq('id', request.id);

        if (!error) {
            toast.success(`שויך ל${driverName}`);
            // שליחת התראה לאיציק
            fetch('/api/notify-itzik', {
                method: 'POST',
                body: JSON.stringify({ reqId: request.id, status: 'מואשר על ידי ' + driverName })
            });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 p-4 gap-4" dir="rtl">
            <audio ref={audioRef} src="/notification_sound.mp3" />
            <Toaster position="top-center" />
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-[#0B2C63]">סידור עבודה - SabanOS</h1>
                <Button variant="outline" className="gap-2"><Share2 size={18}/> שיתוף סידור</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                {/* לוח בקשות איציק */}
                <Card className="p-4 flex flex-col gap-3 overflow-y-auto border-2 border-orange-200">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="font-black flex items-center gap-2"><Bell className="text-orange-500"/> בקשות איציק</h2>
                        <Badge variant="outline">{requests.length}</Badge>
                    </div>
                    
                    {requests.map(req => (
                        <div key={req.id} className="p-3 bg-white rounded-xl shadow-sm border-r-4 border-orange-500 animate-pulse-slow">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-sm">{req.customer_name || 'לקוח מזדמן'}</span>
                                <div className="flex items-center text-[10px] text-orange-600 font-bold">
                                    <Clock size={12} className="ml-1"/>
                                    <RequestTimer startTime={req.created_at} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{req.request_type}: {req.doc_number}</p>
                            
                            <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={() => assignToDriver(req, 'חכמת')} className="h-7 text-[10px] bg-blue-600">שייך לחכמת</Button>
                                <Button size="sm" onClick={() => assignToDriver(req, 'עלי')} className="h-7 text-[10px] bg-slate-800">שייך לעלי</Button>
                            </div>
                        </div>
                    ))}
                </Card>

                {/* דף הסידור המרכזי */}
                <Card className="md:col-span-2 p-4">
                    <div className="space-y-2">
                        {['07:00', '08:00', '09:00', '10:00'].map(hour => (
                            <div key={hour} className="flex items-center gap-4 p-3 border-b hover:bg-slate-100 cursor-pointer rounded-lg transition-colors">
                                <span className="font-black text-blue-600 w-12">{hour}</span>
                                <div className="flex-1 min-h-[40px] border-r-2 pr-4 flex items-center gap-2">
                                    {/* הזמנות קיימות יופיעו כאן */}
                                    <Plus size={14} className="text-slate-300"/>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function RequestTimer({ startTime }: { startTime: string }) {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);
    return <span>{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</span>;
}
