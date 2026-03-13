"use client";
import React, { useState } from 'react';
import { MessageCircle, Send, CheckCircle2, Copy } from 'lucide-react';

interface OrderProps {
  rawText: string; // הטקסט שהדבקת מהלקוח
}

export default function WhatsAppBridge({ rawText }: OrderProps) {
  const [processedOrder, setProcessedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // פונקציה שפונה למוח (API) לעיבוד הטקסט
  const processWithAI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/process-order', {
        method: 'POST',
        body: JSON.stringify({ text: rawText }),
      });
      const data = await response.json();
      setProcessedOrder(data.formatted_message);
    } catch (error) {
      console.error("שגיאה בעיבוד ההזמנה", error);
    } finally {
      setLoading(false);
    }
  };

  // פונקציית השיתוף לווטסאפ
  const shareToWhatsApp = () => {
    if (!processedOrder) return;
    const ramyPhone = "972508860896";
    const url = `https://wa.me/${ramyPhone}?text=${encodeURIComponent(processedOrder)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4" dir="rtl">
      {/* כפתור הפעלה למוח */}
      {!processedOrder && (
        <button 
          onClick={processWithAI}
          disabled={loading}
          className="w-full h-16 bg-[#0B2C63] text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg hover:bg-blue-800 transition-all"
        >
          {loading ? "המוח מעבד נתונים..." : "ג'ימני, עבד הזמנה לשיתוף 🧠"}
        </button>
      )}

      {/* תצוגת ההזמנה המעובדת והכפתור */}
      {processedOrder && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-50 p-6 border-b border-slate-100">
            <h3 className="text-[#0B2C63] font-black flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              ההזמנה מוכנה לשיתוף
            </h3>
          </div>

          <div className="p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed mb-6">
              {processedOrder}
            </pre>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={shareToWhatsApp}
                className="col-span-2 h-16 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-transform active:scale-95"
              >
                <MessageCircle size={24} />
                שלח לקבוצת הווטסאפ
              </button>
              
              <button 
                onClick={() => navigator.clipboard.writeText(processedOrder)}
                className="h-12 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200"
              >
                <Copy size={16} /> העתק טקסט
              </button>
              
              <button 
                onClick={() => setProcessedOrder(null)}
                className="h-12 bg-red-50 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100"
              >
                ביטול ועריכה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
