"use client";
import React, { useState } from 'react';
import { getSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeftRight, CheckCircle2, Clock, X, Share2, User } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ItzikRequestInterface() {
  const [mode, setMode] = useState<'HOME' | 'ORDER' | 'TRANSFER'>('HOME');
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    docNum: '',
    isUrgent: false,
    isReady: false,
    fromBranch: 'התלמיד',
    toBranch: 'החרש',
    time: '07:00'
  });

  const supabase = getSupabase();

  const handleSend = async () => {
    if (!formData.docNum) return toast.error("אחי, חסר מספר מסמך");
    setLoading(true);

    try {
      // שליחה לטבלה החדשה itzik_requests
      const { error } = await supabase.from('itzik_requests').insert([{
        request_type: mode === 'ORDER' ? 'הזמנה' : 'העברה',
        doc_number: formData.docNum,
        is_urgent: formData.isUrgent,
        is_ready: formData.isReady,
        from_branch: formData.fromBranch,
        to_branch: formData.toBranch,
        delivery_time: formData.time,
        delivery_date: new Date().toISOString().split('T')[0]
      }]);

      if (error) throw error;

      toast.success("נשלח לסידור! 🔥");
      setShowPopup(true);
      setTimeout(() => { setMode('HOME'); setShowPopup(false); }, 3000);
    } catch (err) {
      toast.error("שגיאה בשמירה. וודא שהטבלה itzik_requests קיימת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 font-sans" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="max-w-md mx-auto mb-8 flex flex-col items-center pt-6">
        <div className="w-24 h-24 rounded-full border-4 border-[#0B2C63] flex items-center justify-center bg-white shadow-xl mb-2">
            <User size={40} className="text-[#0B2C63]" />
        </div>
        <h1 className="text-2xl font-black text-[#0B2C63]">איציק זהבי</h1>
        <Badge className="bg-blue-100 text-blue-700 border-none">בקשות מהחנות</Badge>
      </div>

      <div className="max-w-md mx-auto">
        {mode === 'HOME' ? (
          <div className="grid grid-cols-1 gap-6">
            <button onClick={() => setMode('ORDER')} className="h-40 bg-white border-b-8 border-blue-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <ShoppingCart size={44} className="text-blue-600" />
                <span className="text-xl font-black text-[#0B2C63]">הזמנה לסידור</span>
            </button>
            <button onClick={() => setMode('TRANSFER')} className="h-40 bg-white border-b-8 border-orange-500 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-all">
                <ArrowLeftRight size={44} className="text-orange-500" />
                <span className="text-xl font-black text-[#0B2C63]">העברה לסניף</span>
            </button>
          </div>
        ) : (
          <Card className="p-6 rounded-[2.5rem] shadow-2xl border-none">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black">{mode === 'ORDER' ? 'פרטי הזמנה' : 'פרטי העברה'}</h2>
                <button onClick={() => setMode('HOME')} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <Input placeholder={mode === 'ORDER' ? "מספר הזמנה" : "מספר העברה"} value={formData.docNum} onChange={e => setFormData({...formData, docNum: e.target.value})} className="h-14 rounded-2xl font-bold text-lg border-2" />
              
              {mode === 'TRANSFER' && (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border-2 border-dashed">
                    <span className="font-black text-xs">{formData.fromBranch} ➡️ {formData.toBranch}</span>
                    <Button onClick={() => setFormData({...formData, fromBranch: formData.toBranch, toBranch: formData.fromBranch})} className="h-8 w-8 rounded-full p-0"><ArrowLeftRight size={14}/></Button>
                </div>
              )}

              <div onClick={() => setFormData({...formData, isReady: !formData.isReady})} className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer ${formData.isReady ? 'border-green-500 bg-green-50' : 'bg-white'}`}>
                <span className="font-black text-sm text-slate-600">הסחורה מוכנה?</span>
                {formData.isReady ? <CheckCircle2 className="text-green-600" /> : <Clock className="text-slate-300" />}
              </div>

              <Button onClick={handleSend} disabled={loading} className="w-full h-16 bg-[#0B2C63] rounded-2xl font-black text-xl shadow-lg mt-4">שלח בקשה 🚀</Button>
            </div>
          </Card>
        )}
      </div>

      {showPopup && (
        <div className="fixed top-8 left-4 right-4 z-[100] animate-in slide-in-from-top-full">
            <Card className="bg-[#0B2C63] text-white p-5 rounded-3xl shadow-2xl flex items-center gap-4 border-b-4 border-green-500">
                <CheckCircle2 className="text-green-500" />
                <div className="font-black text-sm">הבקשה נשלחה ונשמרה בטבלת השאריות!</div>
            </Card>
        </div>
      )}
    </div>
  );
}
