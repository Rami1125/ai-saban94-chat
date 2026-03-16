import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

/**
 * Saban OS V22.0 - Dynamic Brain Engine
 * ------------------------------------
 * - Fetches real-time VIP profile from DB.
 * - Injects context-specific rules (Truck weight, projects).
 * - Implements the "Brotherly Consultant" persona.
 */

export const dynamic = 'force-dynamic';

const API_KEYS = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim());

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const { sessionId, query, history, customerId } = await req.json();

    // 1. שליפת פרופיל הלקוח מה-DB בזמן אמת
    const { data: profile } = await supabase
      .from('vip_profiles')
      .select('*')
      .eq('id', customerId || '601992')
      .maybeSingle();

    // 2. שליפת היסטוריית רכישות אחרונה למניעת כפילויות
    const { data: recentOrders } = await supabase
      .from('vip_customer_history')
      .select('product_name, created_at')
      .eq('customer_id', customerId || '601992')
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. בניית ה-DNA המקצועי המוזרק
    const systemDNA = `
      זהות: המוח הלוגיסטי של ח. סבן. המנהל: ראמי הבוס.
      לקוח נוכחי: ${profile?.full_name || 'VIP'} (פרויקט: ${profile?.main_project || 'כללי'}).
      כינוי לפנייה: ${profile?.nickname || 'אחי'}.

      ### חוקי הבלמים (Executive Enforcement):
      - מגבלת משאית: ${profile?.truck_limit_kg || 12000} ק"ג (כ-18 בלות). 
      - חוק המשקל: אם ההזמנה חורגת מהמשקל, עצור את בר והסבר לו את הסכנה והדו"ח.
      - חוק הכפילות: היסטוריה אחרונה: ${JSON.stringify(recentOrders)}. אם הוא מזמין משהו שקנה ביומיים האחרונים, שאל "בטוח שצריך עוד?".
      - חוק השלמה: גבס דורש ניצבים/מסלולים. מלט דורש חול.

      ### שפה וטון:
      - פתח תמיד בברכה אישית לפי הזמן (בוקר/ערב) וכינוי הלקוח.
      - היה יועץ ומחשב כמויות, לא רק לוקח הזמנות.
      - בסיום, הפק "סיכום הזמנה" ברור לקבוצת הווצאפ.

      חתימה:
      תודה, ומה תרצה שנבצע היום?
      ראמי, הכל מוכן לביצוע. 🦾
    `;

    // 4. שליפת מפתח וביצוע שיחה
    const genAI = new GoogleGenerativeAI(API_KEYS[0]);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemDNA 
    });

    const result = await model.generateContent(query);
    const aiText = result.response.text();

    // 5. שמירת התגובה להיסטוריה
    await supabase.from('chat_history').insert([{ 
      session_id: sessionId, 
      role: 'assistant', 
      content: aiText 
    }]);

    return NextResponse.json({ answer: aiText });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
