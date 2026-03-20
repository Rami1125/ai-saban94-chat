import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const DISCOVERY_MATRIX = [
  { name: "gemini-1.5-flash", versions: ["v1beta"] },
  { name: "gemini-1.5-pro", versions: ["v1beta"] },
  { name: "gemini-2.0-flash-exp", versions: ["v1beta"] }
];
export async function POST(req: Request) {
  let debugLog = ""; // צובר לוגים להצגה למשתמש
  
  try {
    const { query } = await req.json();

    // 1. שליפת קונטקסט (בשביל שהמוח יכיר את השמות המדויקים ב-SQL)
    const { data: currentOrders } = await supabase.from('saban_master_dispatch').select('customer_name, status, scheduled_time').limit(10);
    const contextStr = currentOrders?.map(o => `${o.customer_name} (${o.status})`).join(", ") || "אין הזמנות";

    const systemPrompt = `
      אתה המוח של ח. סבן. 
      הזמנות קיימות ב-SQL (חובה להשתמש בשמות אלו בדיוק!): ${contextStr}
      
      חוקי ביצוע:
      - לעדכון: [UPDATE_ORDER:שם לקוח מדויק|שדה|ערך]
      - השדות המותרים: סטטוס, נהג, שעה, מחסן.
      - דוגמה: [UPDATE_ORDER:א.מ. אדר בניה|סטטוס|בביצוע]
    `;

    // 2. קריאה ל-Gemini (מקוצר לצורך הדוגמה, השתמש בלוגיקת ה-Discovery שלך)
    const apiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeys[0].trim()}`;
    
    const aiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    const aiData = await aiRes.json();
    let finalAnswer = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 3. לוגיקת ה-Update עם דיאגנוסטיקה
    const updateMatch = finalAnswer.match(/\[UPDATE_ORDER:(.*?)\]/);
    
    if (updateMatch) {
      debugLog += "🔍 זיהיתי פקודת UPDATE מהמוח...\n";
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      
      const fieldMapping: any = { 'סטטוס': 'status', 'נהג': 'driver_name', 'שעה': 'scheduled_time' };
      const dbField = fieldMapping[field] || field;

      debugLog += `⚙️ מנסה לעדכן את השדה '${dbField}' לערך '${value}' עבור הלקוח '${customer}'\n`;

      // בדיקה אם הלקוח בכלל קיים לפני העדכון
      const { data: checkCust } = await supabase
        .from('saban_master_dispatch')
        .select('id, customer_name')
        .ilike('customer_name', `%${customer}%`);

      if (!checkCust || checkCust.length === 0) {
        debugLog += `❌ שגיאה: לא נמצא לקוח בשם '${customer}' ב-SQL! וודא שהשם מדויק.\n`;
      } else {
        debugLog += `✅ נמצא לקוח תואם: ${checkCust[0].customer_name}\n`;
        
        const { error: updateErr } = await supabase
          .from('saban_master_dispatch')
          .update({ [dbField]: value })
          .eq('id', checkCust[0].id);

        if (updateErr) {
          debugLog += `❌ שגיאת SQL במעמד העדכון: ${updateErr.message}\n`;
        } else {
          debugLog += `🚀 העדכון בוצע בהצלחה בטבלה!\n`;
        }
      }
    } else {
      debugLog += "⚠️ המוח לא הוציא פקודת [UPDATE_ORDER], הוא רק ענה בטקסט.\n";
    }

    // החזרת התשובה יחד עם הלוגים לראמי
    const combinedAnswer = `${finalAnswer}\n\n---\n**דיאגנוסטיקה (ראמי):**\n${debugLog}`;
    return NextResponse.json({ answer: combinedAnswer });

  } catch (error: any) {
    return NextResponse.json({ error: `שגיאת מערכת: ${error.message}` }, { status: 500 });
  }
}
