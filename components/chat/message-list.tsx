"use client";

import { useMemo } from "react";
import { ProductCard } from "./ProductCard";

export function MessageList({
  messages,
  onConsult,
  isLoading,
}: {
  messages: any[];
  onConsult?: (p: any, t: string) => void;
  isLoading?: boolean;
}) {
  // גם אם onConsult הועבר שגוי — לא נקרוס, נדפיס לוג
  const safeOnConsult = useMemo(
    () =>
      typeof onConsult === "function"
        ? onConsult
        : (p: any, t: string) => {
            console.error("❌ MessageList: onConsult אינו פונקציה!", {
              onConsult,
              product: p,
              type: t,
            });
          },
    [onConsult]
  );

  return (
    <div>
      {messages?.map((m, i) => (
        <div key={i}>
          {/* כאן אפשר להציג את תוכן ההודעה עצמה */}
          {m?.content && (
            <div className="mb-2 text-sm text-slate-700 dark:text-slate-200">{m.content}</div>
          )}

          {/* נרנדר כרטיס מוצר רק אם זה אובייקט מוצר אמיתי עם שם מוצר */}
          {m?.product &&
            typeof m.product === "object" &&
            m.product.product_name && (
              <ProductCard product={m.product} onConsult={safeOnConsult} />
            )}
        </div>
      ))}

      {isLoading ? (
        <div className="text-xs text-slate-400 mt-2">טוען…</div>
      ) : null}
    </div>
  );
}
