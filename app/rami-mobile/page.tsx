"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Send, Mic, MapPin, Truck, Calendar, Home } from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function RamyMobileApp() {
  const [mode, setMode] = useState<'view' | 'add'>('view');
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = getSupabase();

  // טעינה מהירה של סידור היום
  useEffect(() => {
    const fetchToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('saban_dispatch').select('*').eq('scheduled_date', today).order('scheduled_time');
      setOrders(data || []);
    };
    fetchToday();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#0B2C63] text-white font-sans overflow-hidden" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header סלולרי */}
      <div className="p-6 pt-12 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic">SABAN<span className="text-blue-400 font-light text-lg">PRO</span></h1>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">ממשק ראמי - בדרכים</p>
        </div>
        <div className="bg-white/10 p-2 rounded-full border border-white/20">
           <img src="https://i.postimg.cc/d3S0NJJZ/Screenshot-20250623-200646-Facebook.jpg" className="w-10 h-10 rounded-full object-cover" />
        </div>
      </div>

      {/* גוף האפליקציה */}
      <div className="bg-white text-slate-900 rounded-t-[3rem] min-h-[80vh] p-6 shadow-2xl">
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setMode('view')}
            className={`flex-1 h-14 rounded-2xl font-black text-lg ${mode === 'view' ? 'bg-[#0B2C63] text-white' : 'bg-slate-100 text-slate-400'}`}
          >
            מצב סידור
          </Button>
          <Button 
            onClick={() => setMode('add')}
            className={`flex-1 h-14 rounded-2xl font-black text-lg ${mode === 'add' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            + הוספה מהירה
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'view' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               {orders.map(o => (
                 <div key={o.id} className="p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex justify-between items-center">
                   <div>
                     <p className="text-[10px] font-black text-blue-600 italic">{o.scheduled_time.slice(0,5)} | {o.driver_name}</p>
                     <h3 className="font-black text-lg text-slate-800">{o.customer_name}</h3>
                   </div>
                   <Button variant="ghost" className="text-slate-300"><Plus size={20}/></Button>
                 </div>
               ))}
            </motion.div>
          ) : (
            <motion.div initial={{ x: 100 }} animate={{ x: 0 }} className="space-y-4">
               <input placeholder="שם הלקוח" className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-bold border-none outline-none focus:ring-2 ring-blue-500" />
               <input placeholder="כתובת" className="w-full h-14 bg-slate-50 rounded-2xl px-5 font-bold border-none" />
               <div className="grid grid-cols-2 gap-2">
                 <input type="time" className="h-14 bg-slate-50 rounded-2xl px-5 font-bold border-none" />
                 <select className="h-14 bg-slate-50 rounded-2xl px-5 font-bold border-none">
                   <option>חכמת</option>
                   <option>עלי</option>
                 </select>
               </div>
               <Button className="w-full h-16 bg-blue-600 rounded-[2rem] font-black text-xl shadow-xl gap-2 mt-4">
                 <Send size={20} /> שמור עכשיו
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around items-center">
        <Home className="text-blue-600" size={24} />
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center -mt-12 border-8 border-white shadow-xl">
          <Mic className="text-white" size={28} />
        </div>
        <Plus className="text-slate-300" size={24} />
      </div>
    </div>
  );
}
