"use client";
import { useMemo } from "react";
import { ProductCard } from "./ProductCard";

export function MessageList({ messages, onConsult, isLoading }: any) {
  const safeOnConsult = useMemo(
    () => (typeof onConsult === "function" ? onConsult : (p: any, t: string) => {
      console.error("❌ [MessageList] onConsult אינו פונקציה!", { onConsult });
    }),
    [onConsult]
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20" dir="rtl">
      {messages?.map((m: any, i: number) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] p-4 rounded-[25px] ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border"}`}>
            {m.content && <div dangerouslySetInnerHTML={{ __html: m.content }} />}
            {m.product && typeof m.product === "object" && m.product.product_name && (
              <div className="mt-4">
                <ProductCard product={m.product} onConsult={safeOnConsult} />
              </div>
            )}
          </div>
        </div>
      ))}
      {isLoading && <div className="text-xs text-slate-400 p-4">סבן AI חושב...</div>}
    </div>
  );
}
