import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase'; // שימוש ב-Lazy Init שסידרנו

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    // איתחול הלקוח רק בתוך הפונקציה (Runtime בלבד)
    const supabase = getSupabaseClient();

    // חיפוש במלאי
    const { data: products, error: dbError } = await supabase
      .from("inventory")
      .select("*")
      .or(`product_name.ilike.%${message}%,sku.ilike.%${message}%`)
      .limit(3);

    if (dbError) throw dbError;

    // בניית Context עבור ג'מיני
    const productContext = products && products.length > 0 
      ? products.map(p => `${p.product_name} (₪${p.price})`).join(", ")
      : "אין כרגע במלאי";

    // קריאה לג'מיני
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `השב כנציג סבן חומרי בניין. מלאי: ${productContext}. שאלה: ${message}` }] }]
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData.candidates[0].content.parts[0].text;

    return NextResponse.json({ reply, products });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
