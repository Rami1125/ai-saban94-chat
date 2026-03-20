"use client";
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function BrainTestPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBrain = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      console.log("🚀 שולח פקודה ל-API...");
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input })
      });

      const data = await res.json();
      setResponse(data);
      
      if (res.ok) {
        toast.success("תגובה התקבלה מהשרת!");
      } else {
        toast.error("השרת החזיר שגיאה");
      }
    } catch (err: any) {
      console.error("❌ תקלה בתקשורת:", err);
      toast.error("נכשל בפנייה ל-API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-right" dir="rtl">
      <Toaster position="top-center" />
      <div className="max-w-2xl mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-800">מעבדת בדיקה: Saban Brain</h1>
          <p className="text-slate-500 font-bold">דף לבדיקת סנכרון API & SQL</p>
        </header>

        <Card className="p-6 shadow-xl border-none rounded-[2rem]">
          <div className="space-y-4">
            <label className="block font-black text-slate-700">הכנס פקודה לבדיקה:</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="למשל: תשנה סטטוס לאדר בניה ל'בביצוע'"
              className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 min-h-[100px] font-bold"
            />
            <Button 
              onClick={testBrain} 
              disabled={loading}
              className="w-full h-14 bg-[#0B2C63] hover:bg-blue-800 text-white rounded-2xl font-black text-lg"
            >
              {loading ? <Loader2 className="animate-spin ml-2" /> : <Send className="ml-2" />}
              הרץ בדיקת מערכת
            </Button>
          </div>
        </Card>

        {response && (
          <Card className="p-6 border-2 border-blue-100 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
            <h2 className="font-black text-lg mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" /> תוצאות מהשרת:
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-400 mb-1 uppercase">תשובת AI:</p>
                <p className="font-bold text-slate-800">{response.answer || "אין תשובה"}</p>
              </div>

              {response.error && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="text-red-500" />
                  <p className="text-red-700 font-bold text-sm">{response.error}</p>
                </div>
              )}

              <div className="text-[10px] font-mono bg-black text-green-400 p-4 rounded-xl overflow-x-auto">
                <p className="mb-2">// Raw JSON Data:</p>
                {JSON.stringify(response, null, 2)}
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
