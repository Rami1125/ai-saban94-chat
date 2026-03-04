import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // 1. חיפוש ב-Answers Cache (תשובות מוכנות מראש)
    const { data: cachedAnswer } = await supabase
      .from('answers_cache')
      .select('answer_text')
      .ilike('question_text', `%${lastUserMessage}%`)
      .single();

    if (cachedAnswer) {
      return NextResponse.json({ text: cachedAnswer.answer_text });
    }

    // 2. חיפוש ב-Unified Knowledge (נהלים, מחירונים, ידע כללי)
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${lastUserMessage}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // 3. חיפוש מוצר ב-Products + Inventory
    const { data: product } = await supabase
      .from('products')
      .select(`
        product_name, 
        sku, 
        price, 
        inventory (quantity)
      `)
      .ilike('product_name', `%${lastUserMessage}%`)
      .limit(1);

    if (product && product.length > 0) {
      const p = product[0];
      const stock = p.inventory?.[0]?.quantity || 0;
      const response = `<b>פרטי מוצר:</b><br/>${p.product_name}<br/>מק"ט: ${p.sku}<br/>מחיר: ₪${p.price}<br/>מלאי זמין: ${stock} יחידות.`;
      return NextResponse.json({ text: response });
    }

    // 4. ברירת מחדל אם לא נמצא נתון
    return NextResponse.json({ 
      text: "מצטער, לא מצאתי נתון מדויק במערכת לגבי השאלה שלך. ניתן לפנות לנציג אנושי בטלפון של ח. סבן." 
    });

  } catch (error) {
    return NextResponse.json({ error: "שגיאת שליפה מהמסד" }, { status: 500 });
  }
}
