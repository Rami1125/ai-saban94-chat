// app/api/pro_brain/route.ts - גרסה מתוקנת עם הזרקה לסידור
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || process.env.GOOGLE_AI_KEY || "").split(',').map(k => k.trim());
const STABLE_MODELS = ["gemini-1.5-flash", "gemini-3.1-flash-lite-preview"];

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, userName, history } = await req.json();

    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    // 1. שליפת חוקי המוחות (Saban Master DNA)
    const { data: rules } = await supabase.from('ai_rules').select('instruction').eq('is_active', true);
    const educatorDNA = rules?.map(r => r.instruction).join("\n\n") || "";

    const historyContext = history?.map((m: any) => `${m.role === 'user' ? 'לקוח' : 'עוזר'}: ${m.content}`).join("\n") || "";

    // 2. בניית ה-System Prompt (חייב לכלול את הוראת התגים)
    const systemDNA = `
      זהות: המוח המשולב של ח. סבן. מנהל: ראמי.
      חוקי ברזל:
      - בכל הזמנה חובה להשתמש בתגים: [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים] ו-[ADD_TO_CART:SKU].
      - הוסף 10% פחת אוטומטית לכל חישוב.
      ${educatorDNA}
      היסטוריה: ${historyContext}
    `;

    let aiText = "";
    // ... לוגיקת סבב מפתחות (כפי שקיימת אצלך) ...
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ model: STABLE_MODELS[0], systemInstruction: systemDNA });
    const result = await model.generateContent(query);
    aiText = result.response.text();

    // --- 3. המנוע המבצע: הזרקה לסידור העבודה ---
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      const [customer, type, warehouse, time, details] = createMatch[1].split('|').map(s => s.trim());
      
      // הזרקה לטבלה שחקרנו (saban_master_dispatch)
      const { error: dbError } = await supabase.from('saban_master_dispatch').insert([{
        customer_name: customer,
        container_action: type,
        warehouse_source: warehouse,
        scheduled_time: time,
        order_id_comax: details,
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0],
        created_by: 'Saban AI Pro'
      }]);

      if (dbError) console.error("Injection Failed:", dbError.message);
    }

    // שמירת היסטוריה
    await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'assistant', content: aiText }]);
    
    return NextResponse.json({ answer: aiText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
