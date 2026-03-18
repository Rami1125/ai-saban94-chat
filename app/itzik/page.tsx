"use client";
import React, { useState } from 'react';
import { getSupabase } from "@/lib/supabase"; // שימוש בחיבור הקיים
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, ArrowLeftRight, Send, Share2, 
  CheckCircle2, Clock, X, AlertCircle 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// תמונה של איציק מהמאגר המקומי
const ITZIK_IMAGE = "https://i.postimg.cc/44pMM9fH/itzik.jpg"; 

export default function ItzikBranchInterface() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER'>('HOME');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const [formData, setFormData] = useState({
    orderNum: '',
    transferNum: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: '07:00',
    isUrgent: false,
    isReady: false,
    fromBranch: 'התלמיד',
    toBranch: 'החרש'
  });

  const supabase = getSupabase();

  const handleSend = async () => {
    setLoading(true);
    const isOrder = mode === 'ORDER';
    const detail = isOrder ? formData.orderNum : formData.transferNum;

    try {
      // שמירה ל-Supabase
      const { error } = await supabase.from('saban_dispatch').insert([{
        customer_name: isOrder ? 'הזמנת חנות' : `העברה: ${formData.fromBranch} > ${formData.toBranch}`,
        order_id_comax: detail,
        warehouse_source: formData.fromBranch,
        created_by: 'איציק זהבי',
        is_urgent: formData.isUrgent,
        is_ready: formData.isReady,
        scheduled_time: formData.deliveryTime,
        scheduled_date: formData.deliveryDate,
        delivery_type: isOrder ? 'הזמנה חדשה' : 'העברה בין סניפים'
      }]);

      if (error) throw error;

      setLastAction(`${isOrder ? 'הזמנה' : 'העברה'} מס' ${detail} נשלחה בהצלחה!`);
      setShowPopup(true);
      toast.success("נשלח לסידור!");
      
      setTimeout(() => { setMode('HOME'); setShowPopup(false); }, 4000);
    } catch (err) {
      toast.error("שגיאה בשמירה - וודא שעדכנת את הטבלה ב-SQL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-sans" dir="rtl">
      <Toaster position="top-center" />

      {/* Header איציק זהבי */}
      <div className="max-w-md mx-auto mb-10 flex flex-col items-center pt-8">
        <div className="w-28 h-28 rounded-full border-4 border-[#0B2C63] overflow-hidden shadow-2xl mb-3">
            <img src={ITZIK_IMAGE} className="w-full h-full object-cover" alt="איציק" />
        </div>
        <h1 className="text-2xl font-black text-[#0B2C63]">איציק זהבי</h1>
        <Badge className="bg-blue-100 text-blue-700 font-bold border-none">מנהל סניף</Badge>
      </div>

      <div className="max-w-md mx-auto">
        {mode === 'HOME' ? (
          <div className="grid grid-cols-1 gap-6">
            <button onClick={() => setMode('ORDER')} className="h-44 bg-white border-b-8 border-blue-600 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                <ShoppingCart size={48} className="text-blue-600" />
                <span className="text-2xl font-black text-[#0B2C63]">הזמנה חדשה</span>
            </button>
            <button onClick={() => setMode('TRANSFER')} className="h-44 bg-white border-b-8 border-orange-500 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4 active:scale-95 transition-all">
                <ArrowLeftRight size={48} className="text-orange-500" />
                <span className="text-2xl font-black text-[#0B2C63]">העברה בין סניפים</span>
            </button>
          </div>
        ) : (
          <Card className="p-6 rounded-[2.5rem] shadow-2xl border-none animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
                <button onClick={() => setMode('HOME')} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <Input placeholder={mode === 'ORDER' ? "מספר הזמנה (62100614)" : "מספר העברה"} value={mode === 'ORDER' ? formData.orderNum : formData.transferNum} onChange={e => setFormData(mode === 'ORDER' ? {...formData, orderNum: e.target.value} : {...formData, transferNum: e.target.value})} className="h-14 rounded-2xl font-bold text-lg border-2" />
              
              {mode === 'ORDER' && (
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setFormData({...formData, isUrgent: true})} className={`h-12 rounded-xl font-black text-xs ${formData.isUrgent ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>דחוף 🚨</button>
                    <button onClick={() => setFormData({...formData, isUrgent: false})} className={`h-12 rounded-xl font-black text-xs ${!formData.isUrgent ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>רגיל 🟢</button>
                </div>
              )}

              <div onClick={() => setFormData({...formData, isReady: !formData.isReady})} className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all ${formData.isReady ? 'border-green-500 bg-green-50' : 'bg-white'}`}>
                <span className="font-black text-sm">האם הסחורה מוכנה?</span>
                {formData.isReady ? <CheckCircle2 className="text-green-600" /> : <Clock className="text-slate-300" />}
              </div>

              <div className="flex gap-2 pt-4">
                  <Button onClick={handleSend} disabled={loading} className="flex-[4] h-16 bg-[#0B2C63] hover:bg-blue-800 rounded-2xl font-black text-xl shadow-lg">שלח לסידור 🚀</Button>
                  <Button variant="outline" className="flex-1 h-16 border-2 border-green-500 text-green-600 rounded-2xl"><Share2 size={24} /></Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Pop-up התראה מקצועי */}
      {showPopup && (
        <div className="fixed top-8 left-4 right-4 z-[100] animate-in slide-in-from-top-full duration-500">
            <Card className="bg-[#0B2C63] text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between border-b-4 border-green-500">
                <div className="flex items-center gap-4">
                    <div className="bg-green-500 p-2 rounded-full animate-bounce"><CheckCircle2 size={20}/></div>
                    <div className="font-black text-sm">{lastAction}</div>
                </div>
                <button onClick={() => setShowPopup(false)}><X size={20}/></button>
            </Card>
        </div>
      )}
    </div>
  );
}
