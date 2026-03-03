--- a/components/chat/ProductCard.tsx
+++ b/components/chat/ProductCard.tsx
@@
-  <button onClick={() => onConsult(product, "זמן ייבוש")}>
+  const safeConsult = (p: any, t: string) => {
+    if (typeof onConsult === "function") onConsult(p, t);
+    else console.error("❌ [סבן AI] onConsult אינו פונקציה:", onConsult, { product: p, type: t });
+  };
+
+  <button onClick={() => safeConsult(product, "זמן ייבוש")}>
...
-  <button onClick={() => onConsult(product, "חישוב כמויות")}>
+  <button onClick={() => safeConsult(product, "חישוב כמויות")}>
...
-  <button onClick={() => onConsult(product, "התייעצות כללית")}>
+  <button onClick={() => safeConsult(product, "התייעצות כללית")}>

--- a/components/chat/MessageList.tsx
+++ b/components/chat/MessageList.tsx
@@
- {m.product && (
+ {m.product && typeof m.product === "object" && m.product.product_name && (
    <ProductCard product={m.product} onConsult={onConsult} />
  )}

--- a/components/chat/ChatManager.tsx
+++ b/components/chat/ChatManager.tsx
@@
 const handleConsult = (product: any, type: string) => {
   setSelectedProduct(product);
-  append({ role: "user", content: `התייעצות על ${type}: ${product.product_name}` });
+  append(
+    { role: "user", content: `התייעצות על ${type}: ${product.product_name}` },
+    { body: { selectedProduct: product } }
+  );
 };
@@
- <Composer onSendMessage={(msg) => append({ role: 'user', content: msg })} />
+ <Composer onSendMessage={(msg) => append({ role: 'user', content: msg }, { body: { selectedProduct } })} />
