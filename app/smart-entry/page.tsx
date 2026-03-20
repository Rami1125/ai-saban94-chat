"use client";
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardPaste, Sparkles, ShoppingCart, User, MapPin, 
  CheckCircle2, ArrowLeft, Loader2, Send, Trash2, Copy, Check
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from 'next/link';

interface ParsedItem {
  product: string;
  qty: string;
}

interface ProcessedOrder {
  customer: string;
  items: ParsedItem[];
  address: string;
}

export default function SabanSmartEntry() {
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedOrder, setProcessedOrder] = useState<ProcessedOrder | null>(null);
  const [copied, setCopied] = useState(false);

  // 🔥 פונקציית הפיענוח - שליחה למוח (API) לקבלת JSON מפורק
  const processWithAI = async () => {
    if (!rawText.trim()) return toast.error("ראמי, תדביק טקסט קודם... 🦾");
    setIsProcessing(true);
    setProcessedOrder(null);
    
    try {
      const res = await fetch('/api/admin_pro/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `נתח את ההודעה הבאה להזמנה מפורקת: ${rawText}` 
        })
      });
      
      const data = await res.json();
      
      if (data.mode === "PARSER") {
        setProcessedOrder({
          customer: data.customer || "לא זוהה",
          items: data.items || [],
          address: data.address || "איסוף עצמי"
        });
        toast.success("המוח פירק את הרשימה בהצלחה! 🦾");
      } else {
        toast.error("המוח לא זיהה פורמט הזמנה, נסה להדביק שוב.");
      }
    } catch (e) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsProcessing(false);
    }
  };

  // פונקציית העתקה מהירה לקומקס/סידור
  const copyToClipboard = () => {
    if (!processedOrder) return;
    const text = `לקוח: ${processedOrder.customer}\nכתובת: ${processedOrder.address}\n\nמוצרים:\n` + 
                 processedOrder.items.map(i => `- ${i.product}: ${i.qty}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("הכל הועתק, מוכן להדבקה! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmToDispatch = async () => {
    // כאן אפשר להוסיף קריאה ל-Supabase שיוצרת את ההזמנה בלוח הראשי
    toast.info("שולח לסידור העבודה בלוח הראשי...");
    // לוגיקה עתידית: insert ל-saban_master_dispatch
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 font-sans text-right" dir="rtl">
      <Toaster position="top-center" richColors />
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <Link href="/admin/dispatch">
            <Button variant="ghost" className="text-slate-400 gap-2 hover:bg-white/5 border-none">
              <ArrowLeft size={18} /> חזרה לסידור
            </Button>
          </Link>
          <div className="text-left">
            <h1 className="text-2xl font-black italic text-blue-400 flex items-center gap-3 justify-end uppercase tracking-tighter">
              SABAN SMART ENTRY <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">AI Order Parsing Engine</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* צד א': קלט (הדבקה מהוואטסאפ) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black text-slate-400 flex items-center gap-2">
                <ClipboardPaste size={18} className="text-blue-500" /> שלב 1: הדבק טקסט גולמי
              </h3>
              <Badge className="bg-blue-500/10 text-blue-400 border-none text-[9px]">WHATSAPP RAW DATA</Badge>
            </div>
            
            <textarea 
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='הדבק כאן הודעה... למשל: "עלי, תביא לטייבה 5 בלות חול ו-2 טיט, שים ליד המסגד"'
              className="w-full h-72 bg-slate-900/50 border-2 border-slate-800 rounded-[2.5rem] p-8 text-white font-bold outline-none focus:border-blue-500 transition-all resize-none text-right placeholder:text-slate-700 leading-relaxed shadow-inner"
            />
            
            <Button 
              onClick={processWithAI}
              disabled={isProcessing || !rawText}
              className="w-full h-18 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-xl gap-3 shadow-2xl shadow-blue-600/20 border-none cursor-pointer transition-transform active:scale-95"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}
              פענח עם המוח של ח. סבן
            </Button>
          </div>

          {/* צד ב': פלט (כרטיס הזמנה מפורק) */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" /> שלב 2: תוצאת פיענוח המוח
            </h3>
            
            <Card className="min-h-72 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              {!processedOrder ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 italic space-y-4">
                  <ShoppingCart size={64} className="opacity-10" />
                  <p className="font-bold">ממתין להזמנה שתפוענח...</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* זיהוי לקוח */}
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border-r-4 border-blue-500">
                    <div className="bg-blue-500/20 p-2 rounded-xl"><User className="text-blue-400" size={20}/></div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black uppercase italic">לקוח מזוהה</p>
                      <p className="font-black text-white text-2xl tracking-tight leading-none">{processedOrder.customer}</p>
                    </div>
                  </div>

                  {/* טבלת מוצרים */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2 px-2 italic">
                      <ShoppingCart size={12} /> פירוט מוצרים וכמויות
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {processedOrder.items?.map((item, i) => (
                        <div key={i} className="bg-slate-800/40 p-4 rounded-2xl flex justify-between items-center border border-white/5 hover:bg-slate-800 transition-colors">
                          <span className="font-black text-blue-400 text-lg">{item.qty}</span>
                          <span className="font-black text-slate-100 italic">{item.product}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* יעד פריקה */}
                  <div className="flex items-center gap-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                    <MapPin className="text-red-400" size={20} />
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black uppercase italic">מיקום / הערת פריקה</p>
                      <p className="font-bold text-slate-300 text-sm leading-tight">{processedOrder.address}</p>
                    </div>
                  </div>

                  {/* כפתורי פעולה */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button 
                      onClick={copyToClipboard}
                      variant="outline"
                      className="h-14 bg-slate-800 border-none text-white rounded-xl font-black gap-2 hover:bg-slate-700 cursor-pointer"
                    >
                      {copied ? <Check size={18} className="text-green-400"/> : <Copy size={18} />}
                      העתק הכל
                    </Button>
                    <Button 
                      onClick={confirmToDispatch}
                      className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black gap-2 border-none shadow-lg shadow-green-600/20 cursor-pointer"
                    >
                      <Send size={18} /> אשר ללוח
                    </Button>
                  </div>
                </div>
              )}
            </Card>
            
            {processedOrder && (
              <Button 
                variant="ghost" 
                onClick={() => {setProcessedOrder(null); setRawText("");}}
                className="w-full text-slate-500 hover:text-red-400 gap-2 border-none font-bold italic"
              >
                <Trash2 size={16} /> נקה חקירה והתחל חדש
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
