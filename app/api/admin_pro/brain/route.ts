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

// --- 5. עיבוד פקודות משופר ---
// חיפוש גמיש יותר של הפקודה
const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);

if (createMatch) {
    const parts = createMatch[1].split('|').map(s => s.trim());
    // אם המוח שלח פחות מ-5 חלקים, נשלים ברירת מחדל כדי שהקוד לא יקרוס
    const [customer, type, warehouse, time, details] = [
        parts[0] || "לקוח כללי",
        parts[1] || "הובלה",
        parts[2] || "ראשי",
        parts[3] || "08:00",
        parts[4] || "הזמנת AI"
    ];

    const { data: inserted, error: dbError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .insert([{
            customer_name: customer,
            container_action: type,
            warehouse_source: warehouse,
            scheduled_time: time,
            order_id_comax: details,
            status: 'פתוח',
            scheduled_date: new Date().toISOString().split('T')[0],
            created_by: 'Saban AI Brain'
        }]).select();

    if (dbError) {
        console.error("❌ שגיאת הזרקה:", dbError.message);
    } else if (inserted?.[0]) {
        const realId = inserted[0].id;
        aiText = aiText.replace("TEMP_ID", realId);
        console.log("✅ הזמנה הוזרקה בהצלחה! ID:", realId);
    }
} else {
    console.log("⚠️ המוח לא פלט תג [CREATE_ORDER], לכן לא בוצעה הזרקה.");
}

    // שמירת היסטוריה
    await supabase.from('chat_history').insert([{ session_id: sessionId, role: 'assistant', content: aiText }]);
    
    return NextResponse.json({ answer: aiText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
