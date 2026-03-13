"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Truck, Clock, MapPin, Warehouse, Plus, 
  Share2, Edit3, Trash2, ChevronDown, 
  Bot, Send, Calendar, BarChart3 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

const drivers = [
  { name: 'חכמת', img: 'https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg' },
  { name: 'עלי', img: 'https://i.postimg.cc/tCNbgXK3/Screenshot-20250623-200744-Tik-Tok.jpg' }
];

const timeSlots = Array.from({ length: 21 }, (_, i) => {
  const h = Math.floor(i / 2) + 6;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, '0')}:${m}`;
});

export default function SabanControlCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // נתוני טופס להזנה מהירה
  const [newOrder, setNewOrder] = useState({
    customer_name: '', address: '', scheduled_time: '', 
    driver_name: 'חכמת', warehouse_source: 'התלמיד'
  });

  const supabase = getSupabase();

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('saban_dispatch').select('*').order('scheduled_time', { ascending: true });
    setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // פונקציה לפתיחת טופס מתוך הגרף
  const handleSlotClick = (driver: string, time: string) => {
    setNewOrder({ ...newOrder, driver_name: driver, scheduled_time: time });
    setIsFormOpen(true);
  };

  const saveOrder = async () => {
    if (!newOrder.customer_name || !newOrder.scheduled_time) return toast.error("מלא שם לקוח ושעה");
    
    const { error } = await supabase.from('saban_dispatch').insert([{
      ...newOrder,
      scheduled_date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      toast.success("הזמנה שובצה בהצלחה!");
      setIsFormOpen(false);
      fetchOrders();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">SABAN OS טוען...</div>;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header - כפתור חדש לחיץ עכשיו */}
      <div className="bg-[#0B2C63] text-white p-6 rounded-b-[2.5rem] shadow-xl mb-8 border-b-4 border-blue-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-black italic tracking-tighter">SABAN<span className="text-blue-400">OS</span></h1>
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-500 rounded-2xl gap-2 font-bold shadow-lg h-12 px-6">
            <Plus size={20} /> הזמנה חדשה
          </Button>
        </div>
      </div>

      {/* טופס הזנה (Modal) - עובד לשני הכפתורים */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-6" dir="rtl">
          <DialogHeader><DialogTitle className="font-black text-2xl text-[#0B2C63]">הזנה מהירה לסידור</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder({...newOrder, customer_name: e.target.value})} className="rounded-xl h-12" />
            <Input placeholder="כתובת יעד" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="rounded-xl h-12" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={newOrder.scheduled_time} onChange={e => setNewOrder({...newOrder, scheduled_time: e.target.value})} className="rounded-xl h-12" />
              <select className="rounded-xl border p-2 font-bold" value={newOrder.driver_name} onChange={e => setNewOrder({...newOrder, driver_name: e.target.value})}>
                <option>חכמת</option><option>עלי</option>
              </select>
            </div>
            <Button onClick={saveOrder} className="w-full h-14 bg-blue-600 rounded-2xl font-black text-lg shadow-lg">שמור ועדכן סידור 🔥</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {drivers.map((driver) => (
          <div key={driver.name} className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <img src={driver.img} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-blue-50" />
                <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
              </div>

              {/* גרף חצי-שעה לחיץ - כל קוביה פותחת טופס */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {timeSlots.map(time => {
                  const hasOrder = orders.some(o => o.driver_name === driver.name && o.scheduled_time.startsWith(time.slice(0,4)));
                  return (
                    <div key={time} onClick={() => handleSlotClick(driver.name, time)} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-16 rounded-2xl transition-all border-2 flex items-center justify-center ${hasOrder ? 'bg-[#0B2C63] border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-blue-300'}`}>
                        {hasOrder ? <Truck size={16} className="text-white" /> : <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />}
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* רשימת המבורגר נפתחת */}
            <div className="space-y-4">
              {orders.filter(o => o.driver_name === driver.name).map((order) => (
                <Card key={order.id} className="border-none shadow-lg rounded-[1.5rem] bg-white overflow-hidden">
                  <div onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} className="p-5 cursor-pointer flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-blue-50 text-blue-700 font-black px-3 py-2 rounded-xl text-sm">{order.scheduled_time.slice(0, 5)}</Badge>
                      <span className="font-black text-slate-800 text-lg">{order.customer_name}</span>
                    </div>
                    <ChevronDown className={`text-slate-300 transition-transform ${expandedId === order.id ? 'rotate-180 text-blue-500' : ''}`} />
                  </div>
                  {expandedId === order.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-5 bg-slate-50/50 border-t font-bold text-slate-600 text-sm space-y-2">
                      <p>📍 כתובת: {order.address}</p>
                      <p>🏭 מחסן: {order.warehouse_source}</p>
                      <div className="flex gap-2 pt-2"><Button variant="ghost" className="text-red-500"><Trash2 size={16} className="ml-1"/> מחק</Button></div>
                    </motion.div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
