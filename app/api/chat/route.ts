import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database configuration missing" }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.trim();

    // 1. חיפוש חכם ב-Inventory (לפי שם, מק"ט או תיאור)
    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${lastUserMessage}%,sku.ilike.%${lastUserMessage}%,description.ilike.%${lastUserMessage}%`)
      .limit(1);

    if (error) throw error;

    if (products && products.length > 0) {
      const p = products[0];
      
      // יצירת תשובה טקסטואלית מעוצבת
      const responseText = `מצאתי עבורך את <b>${p.product_name}</b>. הנה הפרטים הטכניים מהמערכת:`;

      return NextResponse.json({ 
        text: responseText,
        // הזרקת אובייקט המוצר המלא לצורך רינדור ProductCard
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

    // 2. חיפוש ב-Knowledge Base אם לא נמצא מוצר ספציפי
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${lastUserMessage}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // 3. תשובת ברירת מחדל
    return NextResponse.json({ 
      text: `לא מצאתי מוצר מדויק בשם "${lastUserMessage}". כדאי לנסות חיפוש לפי מק"ט או שם כללי יותר, או לבדוק עם נציג ח. סבן.` 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
