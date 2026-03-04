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

    // חיפוש ב-Inventory (חיפוש גמיש בשם, מק"ט ותיאור)
    const { data: products, error } = await supabase
      .from('inventory')
      .select('*')
      .or(`product_name.ilike.%${lastUserMessage}%,sku.ilike.%${lastUserMessage}%,description.ilike.%${lastUserMessage}%`)
      .limit(1);

    if (error) throw error;

    if (products && products.length > 0) {
      const p = products[0];
      
      const responseText = `מצאתי עבורך מידע על <b>${p.product_name}</b>:`;

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

    // חיפוש ב-Knowledge Base כגיבוי
    const { data: knowledge } = await supabase
      .from('saban_unified_knowledge')
      .select('content')
      .ilike('title', `%${lastUserMessage}%`)
      .limit(1);

    if (knowledge && knowledge.length > 0) {
      return NextResponse.json({ text: knowledge[0].content });
    }

    return NextResponse.json({ 
      text: "לא מצאתי מוצר מדויק. נסה לחפש לפי שם מוצר או מק\"ט." 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
