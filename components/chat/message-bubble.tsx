import React from 'react';
import { ProductCard } from './ProductCard'; // וודא שהנתיב נכון
import { cn } from "@/lib/utils"; // פונקציית עזר לעיצוב classNames

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    // נתונים נוספים שה-API מחזיר עכשיו
    foundProduct?: {
      product_name: string;
      sku: string;
      stock_quantity: number;
      product_magic_link?: string;
      image_url?: string;
    };
  };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex w-full mb-4",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl p-4 shadow-sm",
        isAssistant 
          ? "bg-white border border-slate-200 text-slate-800" 
          : "bg-blue-600 text-white"
      )}>
        {/* תוכן ההודעה הטקסטואלי */}
        <div className="text-sm leading-relaxed mb-3">
          {message.content.replace("MAGIC_URL", "")} 
          {/* אנחנו מנקים את MAGIC_URL מהטקסט כי הכרטיס מחליף אותו */}
        </div>

        {/* הזרקת כרטיס המוצר אם קיים */}
        {isAssistant && message.foundProduct && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ProductCard product={message.foundProduct} />
          </div>
        )}
        
        <div className={cn(
          "text-[10px] mt-1 opacity-50",
          isAssistant ? "text-slate-500" : "text-blue-100"
        )}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
