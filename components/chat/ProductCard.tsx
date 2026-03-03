--- a/components/ProductCard.tsx
+++ b/components/ProductCard.tsx
@@
-export function ProductCard({ product, onConsult = () => {} }: { product: any, onConsult?: (p: any, t: string) => void }) {
+export function ProductCard({ product, onConsult }: { product: any, onConsult?: (p: any, t: string) => void }) {
   const [showVideo, setShowVideo] = useState(false);
   if (!product) return null;
+
+  // מונע קריסה + מדפיס בדיוק מה הגיע
+  const safeConsult = (p: any, t: string) => {
+    if (typeof onConsult === "function") {
+      onConsult(p, t);
+    } else {
+      console.error("❌ onConsult אינו פונקציה!", { onConsult, product: p, type: t });
+    }
+  };

   return (
     <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-[30px] overflow-hidden w-full max-w-[320px] shadow-xl" dir="rtl">
       <div className="w-full h-40 bg-slate-100 relative">
@@
-          <button onClick={() => onConsult(product, "זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
+          <button data-action="drying-time" onClick={() => safeConsult(product, "זמן ייבוש")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
             <Clock size={14} className="mx-auto mb-1 text-orange-500" /> {product.drying_time || "24 שעות"}
           </button>
-          <button onClick={() => onConsult(product, "חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
+          <button data-action="coverage-calc" onClick={() => safeConsult(product, "חישוב כמויות")} className="flex-1 bg-slate-50 p-2 rounded-xl text-[10px] font-bold">
             <Calculator size={14} className="mx-auto mb-1 text-blue-500" /> {product.coverage || "לפי מפרט"}
           </button>
         </div>
-        <button onClick={() => onConsult(product, "התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800">
+        <button data-action="general-consult" onClick={() => safeConsult(product, "התייעצות כללית")} className="w-full bg-[#0B2C63] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-blue-800">
           <MessageCircle size={18} /> התייעצות כאן
         </button>
       </div>
     </motion.div>
   );
 }
