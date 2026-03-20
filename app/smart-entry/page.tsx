"use client";
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardPaste, Sparkles, ShoppingCart, User, MapPin, 
  CheckCircle2, ArrowLeft, Loader2, Send, Trash2 
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from 'next/link';

export default function SabanSmartEntry() {
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedOrder, setProcessedOrder] = useState<any>(null);

  // 🔥 פונקציית הפיענוח - שליחה למוח הקולט
  const processWithAI = async () => {
    if (!rawText.trim()) return toast.error("הדבק טקסט קודם, אחי");
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `נתח את הודעת הוואטסאפ הבאה והוצא לקוח, מוצרים וכתובת: ${rawText}`,
          mode: 'RETAIL_PARSER' // אופציונלי לסינון ב-API
        })
      });
      const data = await res.json();
      
      // המוח מחזיר אובייקט מובנה בתשובה שלו
      // נדמה כאן את הפירוק שה-AI מחזיר
      setProcessedOrder({
        customer: data.extractedCustomer || "לקוח לא זוהה",
        items: data.extractedItems || [], // מערך של {product, qty}
        address: data.extractedAddress || "איסוף עצמי",
        raw: data.aiResponse
      });
      toast.success("ההודעה פוענחה בהצלחה! 🦾");
    } catch (e) {
      toast.error("שגיאה בפיענוח המוח");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmToDispatch = async () => {
    // כאן שולחים פקודת [CREATE_ORDER] ללוח הראשי
    toast.info("שולח לסידור העבודה...");
    // לוגיקה לשליחה לסידור (כמו שעשינו קודם)
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <Link href="/admin/dispatch">
            <Button variant="ghost" className="text-slate-400 gap-2 hover:bg-white/5">
              <ArrowLeft size={18} /> חזרה לסידור
            </Button>
          </Link>
          <div className="text-left">
            <h1 className="text-2xl font-black italic text-blue-400 flex items-center gap-3 justify-end">
              SABAN SMART ENTRY <Sparkles size={24} className="text-yellow-400" />
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">מפענח הזמנות וואטסאפ חכם</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* צד א': הדבקת הטקסט */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 flex items-center gap-2">
              <ClipboardPaste size={18} className="text-blue-500" /> שלב 1: הדבק הודעה מהלקוח
            </h3>
            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='למשל: "אהלן ראמי, תביא לי לטייבה 10 בלות חול ו-3 טיט, שים את זה ליד הבית של חאלד..."'
              className="w-full h-64 bg-slate-900/50 border-2 border-slate-800 rounded-[2rem] p-6 text-white font-bold outline-none focus:border-blue-500 transition-all resize-none text-right"
            />
            <Button 
              onClick={processWithAI}
              disabled={isProcessing || !rawText}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-blue-600/20 border-none cursor-pointer"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              פענח הזמנה עם המוח
            </Button>
          </div>

          {/* צד ב': תוצאת הפיענוח */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> שלב 2: בדוק ואשר לסידור
            </h3>
            <Card className="min-h-64 bg-slate-900 border-2 border-slate-800 rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between">
              {!processedOrder ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 italic">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>הזמנה תופיע כאן לאחר פיענוח</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                    <User className="text-blue-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">לקוח מזוהה</p>
                      <p className="font-black text-white text-xl">{processedOrder.customer}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                      <ShoppingCart size={12} /> רשימת מוצרים
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {processedOrder.items?.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-white/5">
                          <span className="font-black text-blue-400">{item.qty}</span>
                          <span className="font-bold text-slate-200">{item.product}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                    <MapPin className="text-red-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">יעד פריקה</p>
                      <p className="font-bold text-slate-200 text-sm">{processedOrder.address}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={confirmToDispatch}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 rounded-xl font-black gap-2 border-none mt-4 shadow-lg shadow-green-600/20 cursor-pointer"
                  >
                    <Send size={18} /> אשר ושלח ללוח הסידור
                  </Button>
                </div>
              )}
            </Card>
            
            {processedOrder && (
              <Button 
                variant="ghost" 
                onClick={() => {setProcessedOrder(null); setRawText("");}}
                className="w-full text-slate-500 hover:text-red-400 gap-2 border-none"
              >
                <Trash2 size={16} /> נקה הכל
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
