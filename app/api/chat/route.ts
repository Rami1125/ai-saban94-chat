import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // בדיקת חיבור ל-Database
    if (!supabase) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    // חילוץ ההודעות מהבקשה
    const { messages } = await req.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content.trim();

    // --- שלב 1: זיהוי כוונת המשתמש (Intent) ---
    // האם המשתמש מבקש ייעוץ ספציפי על בסיס כפתור או שאלה מפורטת?
    const isConsultation = lastUserMessage.includes("להתייעץ") || 
                           lastUserMessage.includes("מפרט מלא") || 
                           lastUserMessage.includes("זמינות") ||
                           lastUserMessage.includes("מה תוכל לספר לי");

    // ניקוי השאילתה ממילים מיותרות כדי למצוא את שם המוצר נטו
    const stopWords = ["אני", "רוצה", "להתייעץ", "לגבי", "בנושא", "ייעוץ", "מה", "תוכל", "לספר", "לי", "של", "את", "מפרט", "מלא", "זמינות"];
    const productNameQuery = lastUserMessage
      .split(/\s+/)
      .filter((word: string) => !stopWords.includes(word) && word.length > 1)
      .join(" ");

    // --- שלב 2: חיפוש בטבלת ה-Inventory ---
    // ניסיון ראשון: חיפוש גמיש על כל השאילתה המנוקה
    let { data: products, error: prodError } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${productNameQuery}%,sku.ilike.%${productNameQuery}%`)
      .limit(1);

    // ניסיון שני: אם לא נמצא, נחפש רק לפי המילה הראשונה (למשל "גבס")
    if (!products || products.length === 0) {
      const firstWord = productNameQuery.split(' ')[0];
      const { data: retryData } = await supabase
        .from('inventory')
        .select('*')
        .ilike('product_name', `%${firstWord}%`)
        .limit(1);
      products = retryData;
    }

    if (products && products.length > 0) {
      const p = products[0];

      // תרחיש א': המשתמש ביקש ייעוץ (לחיצה על כפתור בכרטיס או שאלה מפורטת)
      if (isConsultation) {
        let advisorText = `לגבי <b>${p.product_name}</b> (מק"ט ${p.sku}):<br/><br/>`;
        
        if (p.description) advisorText += `📝 <b>תיאור:</b> ${p.description}<br/><br/>`;
        
        if (p.features && Array.isArray(p.features) && p.features.length > 0) {
          advisorText += `✅ <b>למה כדאי להשתמש בו?</b><br/>• ${p.features.join('<br/>• ')}<br/><br/>`;
        }

        if (p.drying_time) advisorText += `⏱️ <b>זמן עבודה/ייבוש:</b> ${p.drying_time}<br/>`;
        if (p.coverage) advisorText += `📏 <b>כושר כיסוי הערכתי:</b> ${p.coverage}<br/>`;
        if (p.application_method) advisorText += `🛠️ <b>אופן היישום:</b> ${p.application_method}<br/>`;
        
        advisorText += `<br/>📦 <b>זמינות:</b> המוצר במלאי שוטף. האם תרצה שאחשב לך כמויות מדויקות לפרויקט שלך?`;

        return NextResponse.json({ 
          text: advisorText,
          // בייעוץ עומק, אפשר לשלוח את המוצר שוב או לוותר כדי למנוע כפילות ויזואלית
          product: p 
        });
      }

      // תרחיש ב': חיפוש ראשוני - מחזירים הודעה קצרה וכרטיס ויזואלי
      const responseText = `מצאתי עבורך את <b>${p.product_name}</b>. הנה הפרטים המהירים:`;
      return NextResponse.json({ 
        text: responseText,
        product: {
          id: p.id || p.sku,
          product_name: p.product_name,
          sku: p.sku,
          price: p.price,
          image_url: p.image_url,
          description: p.description,
          drying_time: p.drying_time,
          coverage: p.coverage,
          features: p.features,
          youtube_url: p.youtube_url
        }
      });
    }

    // --- שלב 3: חיפוש ב-Knowledge Base (מידע כללי/נהלים) ---
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${productNameQuery.split(' ')[0]}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // --- שלב 4: הודעת אי-מציאה חכמה ---
    return NextResponse.json({ 
      text: `לא מצאתי מוצר שתואם בדיוק לחיפוש "${lastUserMessage}". <br/><br/><b>טיפ מהמומחה של סבן:</b> נסה לחפש לפי מילה אחת (כמו "סיקה" או "מלט") או הזן מק"ט מדויק.` 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
