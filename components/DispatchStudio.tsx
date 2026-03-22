"use client";
import React, { useEffect, useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, Plus, Clock, Bell, Share2, 
  CheckCircle, MapPin, User, Package, Calendar
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";

export default function DispatchStudio() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabase();

    useEffect(() => {
        fetchDispatch();

        // האזנה לשינויים בזמן אמת בסידור
        const channel = supabase
            .channel('dispatch_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_master_dispatch' }, () => {
                fetchDispatch();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchDispatch = async () => {
        const { data } = await supabase
            .from('saban_master_dispatch')
            .select('*')
            .order('scheduled_time', { ascending: true });
        setOrders(data || []);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('saban_master_dispatch')
            .update({ status })
            .eq('id', id);

        if (!error) toast.success(`סטטוס עודכן ל-${status}`);
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] p-6 gap-6 overflow-hidden" dir="rtl">
            <Toaster position="top-center" richColors />
            
            {/* Header Studio */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-[#0B2C63] p-3 rounded-2xl shadow-lg">
                        <Truck size={32} className="text-white"/>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#0B2C63] tracking-tighter">DISPATCH STUDIO</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">SabanOS Operations Center</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl border-slate-200 font-bold gap-2 px-6 h-12 shadow-sm">
                        <Calendar size={18}/> {new Date().toLocaleDateString('he-IL')}
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold gap-2 px-6 h-12 shadow-lg shadow-emerald-200">
                        <Plus size={18}/> הזמנה ידנית
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
                {/* לוח בקשות מה-AI (המלשינון הלוגיסטי) */}
                <Card className="lg:col-span-1 p-5 flex flex-col gap-4 border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                            <Bell size={20} className="text-orange-500 animate-pulse"/> הזמנות AI חדשות
                        </h2>
                        <Badge className="bg-[#0B2C63] rounded-lg px-3 py-1">{orders.filter(o => o.status === 'פתוח').length}</Badge>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        {orders.filter(o => o.status === 'פתוח').map(order => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={order.id}>
                                <Card className="p-5 rounded-[1.8rem] border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all border-r-4 border-r-orange-500 cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-black text-[#0B2C63] text-base">{order.customer_name}</span>
                                        <Badge variant="outline" className="text-[10px] border-slate-200 bg-white">{order.scheduled_time}</Badge>
                                    </div>
                                    <div className="space-y-2 mb-4 text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400"/> {order.warehouse_source}</div>
                                        <div className="flex items-center gap-2"><Package size={14} className="text-slate-400"/> {order.container_action}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => updateStatus(order.id, 'בביצוע')} size="sm" className="flex-1 bg-[#0B2C63] rounded-xl font-bold h-9">שייך לנהג</Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                {/* לוח הסידור המרכזי (Timeline) */}
                <Card className="lg:col-span-3 p-8 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800">סידור עבודה יומי</h2>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full"/> בוצע
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"/> בדרך
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {Array.from({ length: 13 }, (_, i) => i + 6).map(hour => {
                            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                            const ordersAtHour = orders.filter(o => o.scheduled_time.startsWith(hour.toString().padStart(2, '0')));
                            
                            return (
                                <div key={hour} className="flex gap-6 p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all border-b border-slate-50 group">
                                    <div className="flex flex-col items-center justify-center w-16">
                                        <span className="font-black text-xl text-slate-300 group-hover:text-[#0B2C63] transition-colors">{hourStr}</span>
                                    </div>
                                    <div className="flex-1 min-h-[60px] flex gap-4 items-center">
                                        {ordersAtHour.map(o => (
                                            <Badge key={o.id} className="bg-white border border-slate-200 text-[#0B2C63] p-3 rounded-xl shadow-sm flex items-center gap-3 animate-in zoom-in-95">
                                                <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><Truck size={16}/></div>
                                                <span className="font-bold">{o.customer_name}</span>
                                                <div className="h-4 w-px bg-slate-100 mx-1" />
                                                <span className="text-[10px] opacity-60 uppercase">{o.container_action}</span>
                                            </Badge>
                                        ))}
                                        {ordersAtHour.length === 0 && (
                                            <div className="text-slate-200 text-xs font-bold italic opacity-0 group-hover:opacity-100 transition-opacity">חלון זמן פנוי לשיבוץ...</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
