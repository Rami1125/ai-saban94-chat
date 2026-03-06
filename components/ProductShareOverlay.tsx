"use client";

import React from "react";
import { Send, Share2, Smartphone } from "lucide-react";

export function ProductShareOverlay({ product, onSend }: { product: any, onSend: () => void }) {
  // בניית הודעת הווטסאפ המעוצבת
  const handleShareToWhatsApp = () => {
    const message = `*ח. סבן - הצעה למוצר: ${product?.product_name}*\n` +
                    `💰 מחיר: ${product?.price}₪\n` +
                    `📦 SKU: ${product?.sku}\n` +
                    `📍 לפרטים נוספים והזמנה לחץ כאן: https://saban94.co.il/product/${product?.sku}`;
    
    // שליחה לצינור של רמי ב-Firebase (כדי שזה יצא מהבוט/תוסף)
    onSend(); 
    
    // פתיחת ווטסאפ ידנית לגיבוי
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* תצוגה מקדימה של הכרטיס */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-200 rounded-[32px] p-6 text-center">
        <img 
          src={product?.image_url} 
          className="w-32 h-32 mx-auto object-contain mb-4 rounded-xl shadow-sm"
          alt={product?.product_name}
        />
        <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2 italic">
          {product?.product_name || "לוח גבס סטנדרטי"}
        </h3>
        <p className="text-blue-600 font-black text-2xl mb-4">{product?.price}₪</p>
      </div>

      <div className="space-y-3">
        <button 
          onClick={handleShareToWhatsApp}
          className="w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Share2 size={20} />
          שלח כרטיס מוצר לווטסאפ
        </button>
        
        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
          ההודעה תשלח ישירות ללקוח דרך המערכת
        </p>
      </div>
    </div>
  );
}
