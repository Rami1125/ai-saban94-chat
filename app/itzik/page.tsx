"use client";
import React, { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, Share2, ArrowLeftRight, ShoppingCart, Clock, 
  CheckCircle2, AlertTriangle, X, Warehouse, User
} from "lucide-react";
import { toast, Toaster } from "sonner";

// קישור לתמונה של איציק כפי שביקשת
const ITZIK_IMAGE = "https://i.postimg.cc/placeholder-itzik.jpg"; 

export default function ItzikDispatchInterface() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER'>('HOME');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const [formData, setFormData] = useState({
    orderNum: '',
    deliveryTime: '07:00',
    deliveryDate: new Date().toISOString().split('T')[0],
    isUrgent: false,
    isReady: false,
    fromBranch: 'התלמיד',
    toBranch: 'החרש',
    transferNum: ''
  });

  const supabase = getSupabase();

  const handleSend = async () => {
    if ((mode === 'ORDER' && !formData.orderNum) || (mode === 'TRANSFER' && !formData.transferNum)) {
      return toast.error("אחי, חסר מספר הזמנה/העברה");
    }

    setLoading(true);
    const type = mode === 'ORDER' ? 'הזמנה חדשה' : 'העברה בין סניפים';
    const detail = mode === 'ORDER' ? formData.orderNum : formData.transferNum;

    try {
      // שמירה ל-Supabase לתיעוד במלשינון
      const { error } = await supabase.from('saban_dispatch').insert([{
        customer_name: mode === 'ORDER' ? 'הזמנת חנות' : `העברה: ${formData.fromBranch} > ${formData.toBranch}`,
        order_id_comax: detail,
        warehouse_source: formData.fromBranch,
        created_by: 'איציק זהבי',
        is_urgent: formData.isUrgent,
        is_ready: formData.isReady,
        scheduled_time: formData.deliveryTime,
        scheduled_date: formData.deliveryDate,
        delivery_type: type
      }]);

      if (error) throw error;

      setLastAction(`${type} מס' ${detail} נשלחה לסידור!`);
      setShowPopup(true);
      toast.success("נשלח בהצלחה!");
      
      // איפוס וחזרה לבית
      setTimeout(() => {
        setMode('HOME');
        setFormData({ ...formData, orderNum: '', transferNum: '', isUrgent: false, isReady: false });
      }, 1500);

    } catch (err) {
      toast.error("שגיאה בתקשורת");
    } finally {
      setLoading(false);
    }
  };

  const shareToWhatsApp = () => {
    const urgency = formData.isUrgent ? "🚨 *דחוף!*" : "🟢 רגיל";
    const ready = formData.isReady ? "✅ מוכנה להעמסה" : "⏳ לא מוכנה";
    
    let msg = "";
    if (mode === 'ORDER') {
      msg = `*📌 בקשת הובלה - איציק זהבי*\n---------------------------\n🔹 *סוג:* הזמנת לקוח\n🔢 *מספר:* ${formData.orderNum}\n📅 *תאריך:* ${formData.deliveryDate}\n⏰ *שעה:* ${formData.deliveryTime}\n🚦 *דחיפות:* ${urgency}\n📦 *מצב:* ${ready}\n---------------------------\n_נשלח מאפליקציית SabanOS_`;
    } else {
      msg = `*🔄 בקשת העברה - איציק זהבי*\n---------------------------\n🚛 *מ:* ${formData.fromBranch} > *אל:* ${formData.toBranch}\n🔢 *מספר העברה:* ${formData.transferNum}\n📦 *מצב:* ${ready}\n---------------------------\n_נשלח מאפליקציית SabanOS_`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans p-4 pb-10" dir="rtl">
      <Toaster position="top-center" richColors />

      {/* Header המקצועי של איציק */}
      <div className="max-w-md mx-auto mb-8 flex flex-col items-center">
        <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#0B2C63] overflow-hidden shadow-2xl mb-2">
                <img src={ITZIK_IMAGE} alt="איציק זהבי" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-2 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h1 className="text-2xl font-black text-[#0B2C63]">איציק זהבי</h1>
        <Badge className="bg-blue-100 text-blue-700 font-bold border-none">ניהול סניף והזמנות</Badge>
      </div>

      <div className="max-w-md mx-auto">
        {mode === 'HOME' ? (
          <div className="grid grid-cols-1 gap-6 pt-10">
            <button onClick={() => setMode('ORDER')} className="h-44 bg-white border-b-8 border-blue-600 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                <div className="bg-blue-50 p-4 rounded-full text-blue-600"><ShoppingCart size={48} /></div>
                <span className="text-2xl font-black text-[#0B2C63]">הזמנה חדשה</span>
            </button>
            <button onClick={() => setMode('TRANSFER')} className="h-44 bg-white border-b-8 border-orange-500 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                <div className="bg-orange-50 p-4 rounded-full text-orange-500"><ArrowLeftRight size={48} /></div>
                <span className="text-2xl font-black text-[#0B2C63]">העברה בין סניפים</span>
            </button>
          </div>
        ) : (
          <Card className="p-6 rounded-[2.5rem] shadow-2xl border-none">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-[#0B2C63]">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
                <Button variant="ghost" onClick={() => setMode('HOME')} className="rounded-full h-10 w-10 p-0 bg-slate-100"><X size={20}/></Button>
            </div>

            <div className="space-y-4">
              {mode === 'ORDER' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="date" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} className="h-14 rounded-2xl font-bold" />
                    <Input type="time" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} className="h-14 rounded-2xl font-bold" />
                  </div>
                  <Input placeholder="מספר הזמנה (62100614)" value={formData.orderNum} onChange={e => setFormData({...formData, orderNum: e.target.value})} className="h-14 rounded-2xl font-bold text-lg" />
                  
                  <div className="flex gap-2">
                    <button onClick={() => setFormData({...formData, isUrgent: true})} className={`flex-1 h-12 rounded-xl font-black text-xs ${formData.isUrgent ? 'bg-red-600 text-white' : 'bg-slate-100'}`}>דחוף 🚨</button>
                    <button onClick={() => setFormData({...formData, isUrgent: false})} className={`flex-1 h-12 rounded-xl font-black text-xs ${!formData.isUrgent ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>רגיל 🟢</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400">מ-סניף</span>
                        <div className="font-black text-[#0B2C63]">{formData.fromBranch}</div>
                    </div>
                    <Button onClick={() => setFormData({...formData, fromBranch: formData.toBranch, toBranch: formData.fromBranch})} className="rounded-full bg-white shadow-md text-blue-600 h-10 w-10"><ArrowLeftRight size={16}/></Button>
                    <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400">ל-סניף</span>
                        <div className="font-black text-[#0B2C63]">{formData.toBranch}</div>
                    </div>
                  </div>
                  <Input placeholder="מספר העברה" value={formData.transferNum} onChange={e => setFormData({...formData, transferNum: e.target.value})} className="h-14 rounded-2xl font-bold text-lg" />
                </>
              )}

              <div onClick={() => setFormData({...formData, isReady: !formData.isReady})} className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${formData.isReady ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}>
                <span className="font-black text-sm">הסחורה מוכנה להעמסה?</span>
                {formData.isReady ? <CheckCircle2 className="text-green-600" /> : <Clock className="text-slate-300" />}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-4">
                  <Button onClick={handleSend} disabled={loading} className="col-span-4 h-16 bg-[#0B2C63] hover:bg-blue-800 rounded-2xl font-black text-xl shadow-xl">
                    שלח לסידור 🚀
                  </Button>
                  <Button onClick={shareToWhatsApp} variant="outline" className="h-16 rounded-2xl border-2 border-green-500 text-green-600 p-0 flex items-center justify-center">
                    <Share2 size={24} />
                  </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Pop-up הודעה מאפליקציה של איציק */}
      {showPopup && (
        <div className="fixed top-10 left-4 right-4 z-[100] animate-in slide-in-from-top-10">
            <Card className="bg-[#0B2C63] text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between border-b-4 border-green-500">
                <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-2 rounded-full animate-bounce"><CheckCircle2 size={20}/></div>
                    <div>
                        <div className="font-black text-sm">הודעה מהאפליקציה של איציק</div>
                        <div className="text-xs text-blue-200">{lastAction}</div>
                    </div>
                </div>
                <button onClick={() => setShowPopup(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </Card>
        </div>
      )}
    </div>
  );
}
