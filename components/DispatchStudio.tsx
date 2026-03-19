"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, X, Check, MessageSquare, Clock, 
  AlertTriangle, Filter, LayoutDashboard
} from "lucide-react";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";

export default function DispatchStudio() {
  const [requests, setRequests] = useState<any[]>([]);
  const supabase = getSupabase();

  useEffect(() => {
    fetchPendingRequests();
    const sub = supabase.channel('dispatch_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saban_requests' }, () => {
        (window as any).playNotificationSound?.();
        fetchPendingRequests();
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchPendingRequests = async () => {
    const { data } = await supabase.from('saban_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setRequests(data || []);
  };

  const approveRequest = async (id: string) => {
    await supabase.from('saban_requests').update({ status: 'approved' }).eq('id', id);
    // כאן OneSignal ישלח אוטומטית אם הגדרנו Function, או שנשלח קריאת API ידנית
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden font-sans">
      {/* Top Navigation */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl">
            <LayoutDashboard size={20}/>
          </div>
          <h1 className="text-xl font-black tracking-tight">סידור עבודה - Saban OS</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* המבורגר בקשות איציק */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative border-slate-700 bg-slate-800 hover:bg-slate-700 rounded-xl gap-2 font-bold">
                <Menu size={18}/> בקשות מהשטח
                {requests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-slate-900 animate-pulse">
                    {requests.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[400px] bg-slate-50 border-none p-0">
              <div className="p-6 bg-white border-b border-slate-100">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black text-slate-800">בקשות ממתינות</SheetTitle>
                </SheetHeader>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-100px)]">
                {requests.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-bold">אין בקשות חדשות</div>
                ) : (
                  requests.map(req => (
                    <Card key={req.id} className="p-5 rounded-2xl border-none shadow-sm bg-white border-r-4 border-orange-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge className="bg-orange-100 text-orange-600 mb-1">{req.request_type}</Badge>
                          <div className="text-lg font-black text-slate-800">מסמך: {req.doc_number}</div>
                          <div className="text-sm text-slate-500 font-bold flex items-center gap-1">
                            <Clock size={14}/> {req.delivery_date} | {req.time_window}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-300 font-black">איציק זהבי</div>
                      </div>
                      
                      {req.notes && (
                        <div className="bg-slate-50 p-3 rounded-xl text-sm font-medium text-slate-600 mb-4 flex gap-2">
                          <MessageSquare size={16} className="shrink-0 opacity-50"/>
                          {req.notes}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={() => approveRequest(req.id)} className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl font-bold gap-2">
                          <Check size={18}/> אשר
                        </Button>
                        <Button variant="outline" className="rounded-xl border-slate-200">
                          מענה
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* אזור הסידור הראשי (המפות והלוח הקיים) */}
      <div className="flex-1 p-6">
        {/* כאן נכנס הלוגיקה הקיימת של גרירת הזמנות וכו' */}
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-8 bg-slate-800/50 rounded-[32px] border border-slate-800 flex items-center justify-center border-dashed">
                <span className="text-slate-500 font-bold italic">מפת סידור ומשאיות (עלי וחכמת)</span>
            </div>
            <div className="col-span-4 space-y-4">
                <div className="bg-slate-800/50 p-6 rounded-[32px] border border-slate-800">
                    <h3 className="font-black text-lg mb-4">סיכום יומי</h3>
                    {/* סטטיסטיקות */}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
