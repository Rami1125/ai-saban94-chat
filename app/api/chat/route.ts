import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getRTDB } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // --- הטמעת חיפוש חכם כאן ---
    // 1. ניקוי השאלה ממילים מיותרות וסימני שאלה
    const cleanSearch = lastUserMsg.replace(/[?？]/g, "").trim();
    
    // 2. שליפת DNA וחיפוש מוצר גמיש
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type, description')
        // מחפש אם שם המוצר מכיל חלק מהמילים שהלקוח כתב
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // לוגיקה נוספת: אם לא נמצא, ננסה לחפש רק לפי המילה הראשונה (למשל "גבס")
    if (!product && cleanSearch.includes(" ")) {
      const firstWord = cleanSearch.split(" ")[0];
      const fallbackSearch = await supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku, price, unit_type, description')
        .ilike('product_name', `%${firstWord}%`)
        .limit(1)
        .maybeSingle();
      if (fallbackSearch.data) product = fallbackSearch.data;
    }
    // --- סוף הטמעת חיפוש חכם ---

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    const product = inventoryRes.data;

    // 2. ניהול מפתחות ומודלים - מעודכן למרץ 2026
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    // שימוש במודלים הכי מתקדמים של Gemini נכון להיום
     const modelPool = [
      "gemini-3.1-flash-lite-preview", // הכי מהיר וחדש (מרץ 3)
      "gemini-3.1-pro-preview",       // הכי חכם (מרץ 9)
      "gemini-3-flash-preview"        // גיבוי יציב
    ];
    
    let aiResponse = "";
    let success = false;

    // 3. לוגיקת רוטציה חכמה
    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${executorDNA}
              תפקיד: מנהל מכירות דיגיטלי ב-"ח. סבן חומרי בניין".
              
              --- כלי עבודה: כרטיס מוצר מהמלאי ---
              ${product ? `
              מצאתי במערכת מוצר מתאים:
              📦 *${product.product_name}*
              --------------------------------
              📝 תיאור: ${product.description || "חומר בניין מקצועי"}
              💰 מחיר: ₪${product.price} ${product.unit_type ? `ל-${product.unit_type}` : ""}
              ✅ מלאי: ${product.stock_quantity > 0 ? "זמין לאספקה" : "צור קשר לבדיקת מלאי"}
              🆔 מק"ט: ${product.sku}
              --------------------------------
              🔗 לרכישה: MAGIC_URL
              ` : "לא נמצא מוצר ספציפי במלאי. השב באדיבות על מגוון חומרי הבניין שלנו."}

              הנחיות:
              1. ענה בעברית פשוטה, "בגובה העיניים", כמו איש מכירות מנוסה.
              2. אם יש מוצר, הצג את הכרטיס המודגש לעיל.
              3. בסוף כל הודעה, תמיד תחתום בברכה: "תודה שבחרתה בח.סבן חומרי בנין".
              4. חתימת מותג: H.SABAN 1994.
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.warn(`Error with key/model. Switching...`);
        }
      }
    }

    // 4. עיבוד סופי ועדכון ה-Pipeline
    if (product && aiResponse.includes("MAGIC_URL")) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product?sku=${product.sku}`;
      aiResponse = aiResponse.replace("MAGIC_URL", finalLink);
    }

    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ 
      text: aiResponse || "שלום, כאן ח. סבן. איך נוכל לעזור לכם היום בפרויקט?",
      product: product // שולח את האובייקט ל-Frontend לשימוש ב-UI
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
