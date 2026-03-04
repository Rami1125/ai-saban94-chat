import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { messages } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

    // 1. חיפוש ב-Knowledge Base (טבלת הידע של סבן)
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${lastUserMessage}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    // 2. חיפוש מוצר וזמינות מלאי
    const { data: product } = await supabase
      .from('products')
      .select('product_name, sku, price')
      .ilike('product_name', `%${lastUserMessage}%`)
      .limit(1);

    if (product && product.length > 0) {
      const p = product[0];
      const response = `מצאתי את המוצר: <b>${p.product_name}</b>.<br/>מחיר: ₪${p.price}<br/>מק"ט: ${p.sku}.<br/>תרצה שאבדוק מלאי זמין?`;
      return NextResponse.json({ text: response });
    }

    // 3. ברירת מחדל
    return NextResponse.json({ 
      text: "לא מצאתי תשובה מדויקת במאגר הנתונים. האם תרצה לדבר עם נציג של ח. סבן?" 
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
