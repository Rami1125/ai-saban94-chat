--- a/components/message-list.tsx
+++ b/components/message-list.tsx
@@
-export function MessageList({ messages, onConsult, isLoading }: any) {
+import { useMemo } from "react";
+export function MessageList({ messages, onConsult, isLoading }: any) {
+  // אם מישהו העביר onConsult לא-פונקציה, לא נפיל את האפליקציה
+  const safeOnConsult = useMemo(
+    () => (typeof onConsult === "function" ? onConsult : (p: any, t: string) => {
+      console.error("❌ MessageList: onConsult אינו פונקציה!", { onConsult, product: p, type: t });
+    }),
+    [onConsult]
+  );
   return (
     <div>
       {messages.map((m, i) => (
         <div key={i}>
           {/* ... תוכן ההודעה ... */}
-          {m.product && (
-            <ProductCard 
-              product={m.product} 
-              onConsult={onConsult} // חיבור הצינור
-            />
-          )}
+          {m?.product && typeof m.product === "object" && m.product.product_name && (
+            <ProductCard
+              product={m.product}
+              onConsult={safeOnConsult}
+            />
+          )}
         </div>
       ))}
     </div>
   );
 }
