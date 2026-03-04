import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not connected" }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.trim();

    // --- שלב 1: ניקוי השאילתה למציאת מילות מפתח ---
    // אנחנו מסירים מילים שכיחות שלא קשורות לשם המוצר
    const stopWords = ["אני", "רוצה", "להתייעץ", "לגבי", "בנושא", "ייעוץ", "מה", "תוכל", "לספר", "לי", "של", "את"];
    let searchTerms = lastUserMessage
      .split(/\s+/)
      .filter((word: string) => !stopWords.includes(word) && word.length > 1)
      .join(" & "); // פורמט לחיפוש טקסט מלא ב-Postgres

    // --- שלב 2: חיפוש ב-Inventory ---
    // ננסה קודם חיפוש גמיש (ilike) על השאילתה המקורית
    let { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${lastUserMessage.split(' ')[0]}%,sku.ilike.%${lastUserMessage}%`)
      .limit(1);

    // אם לא נמצא, ננסה לחפש לפי המילה הראשונה המשמעותית (למשל "גבס")
    if (!products || products.length === 0) {
      const mainKeyword = lastUserMessage.replace("אני רוצה להתייעץ לגבי", "").trim().split(' ')[0];
      const { data: secondTry } = await supabase
        .from('inventory')
        .select('*')
        .ilike('product_name', `%${mainKeyword}%`)
        .limit(1);
      products = secondTry;
    }

    if (products && products.length > 0) {
      const p = products[0];
      const responseText = `בשמחה! הנה הפרטים הטכניים על <b>${p.product_name}</b> שביקשת:`;

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

    // --- שלב 3: חיפוש במידע כללי ---
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${lastUserMessage.split(' ')[0]}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // --- שלב 4: הודעת אי-מציאה חכמה ---
    return NextResponse.json({ 
      text: `לא מצאתי מוצר שתואם בדיוק לחיפוש "${lastUserMessage}". <br/><br/><b>טיפ:</b> נסה להקליד רק "גבס לבן" או את המק"ט המדויק.` 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
