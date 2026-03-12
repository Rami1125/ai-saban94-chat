import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // איתחול ה-Client בתוך הפונקציה בלבד
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !geminiKey) {
       console.error("Missing Environment Variables");
       return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const genAI = new GoogleGenerativeAI(geminiKey);

    const { messages, userId, phone } = await req.json();
    const lastUserMessage = messages[messages.length - 1].content;
    

    // 1. שליפת חוקי ADMIN ו-DNA מה-Supabase
    const { data: adminSettings } = await supabase
      .from('system_settings')
      .select('content')
      .eq('key', 'saban_ai_dna')
      .single();

    // 2. חיפוש מוצר במלאי (Semantic Search)
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .textSearch('search_tsv', lastUserMessage, { config: 'simple', type: 'phrase' })
      .limit(1)
      .single();

    // 3. בניית הנחיות המוח
    const systemPrompt = `
      CONTEXT: אתה היועץ הראשי של "ח. סבן חומרי בניין".
      ADMIN_DNA: ${adminSettings?.content || "דבר בעברית פשוטה, מקצועית, ותמציתית."}
      
      PRODUCT_CONTEXT: ${product ? `נמצא מוצר: ${product.product_name}. מחיר: ${product.price}. צריכה למ"מ: ${product.consumption_per_mm}.` : "לא נמצא מוצר ספציפי."}
      
      RULES:
      - אם המשתמש שואל על כמות, בצע חישוב: (שטח במ"ר * צריכה למ"מ) / גודל אריזה.
      - תמיד תברך ותייעץ בצורה חברית אך מקצועית (סגנון 'מתכנת אומנותי').
      - אל תחזור על השאלה.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([systemPrompt, ...messages.map(m => m.content)]);
    const text = result.response.text();

    // שמירה ללוגים (חיסכון באנרגיה וניטור)
    await supabase.from('chat_history').insert({ user_id: userId, message: lastUserMessage, response: text });

    return Response.json({ 
      text, 
      product: product || null,
      shouldNotify: true // טריגר לצליל ב-Frontend
    });

  } catch (error) {
    console.error("Brain Error:", error);
    return Response.json({ text: "תקלה בחיבור למוח." }, { status: 500 });
  }
}
