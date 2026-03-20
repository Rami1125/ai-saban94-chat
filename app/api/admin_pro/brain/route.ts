import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// חיבור מאובטח ל-Supabase עם Service Role לביצוע פעולות כתיבה
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { query, history = [] } = await req.json();
    const apiKey = process.env.GOOGLE_AI_KEY;
    const MODEL_NAME = "gemini-3.1-flash-lite-preview";

    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    // --- ה-System Prompt המאוחד והחכם ---
    const systemPrompt = `אתה המוח הלוגיסטי של ח. סבן. 
    תפקידך: לנהל את סידור העבודה בשפה אנושית ("אחי", "ראמי") ולבצע פקודות SQL.
    
    חוקי פקודות:
    1. יצירת הזמנה (מכולה/חומר): [CREATE_ORDER:לקוח|סוג|מחסן|שעה|פרטים].
       - סוג: הצבה, החלפה, הוצאה, חומרי בניין.
       - אם חסר נתון מהותי, שאל את המשתמש לפני הביצוע.
    2. עדכון קיים: [UPDATE_ORDER:לקוח|שדה|ערך]. (שדות: status, driver_name, scheduled_time, order_id_comax).
    
    חוק לינק הקסם:
    לאחר כל יצירה מוצלחת, עליך לחתום במשפט: "הנה הלינק למעקב אישי עבור הלקוח: https://saban-os.vercel.app/track/TEMP_ID".
    ה-API יחליף את TEMP_ID ב-ID האמיתי אוטומטית.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      }),
    });

    const aiData = await res.json();
    let aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let executionResult = "NO_ACTION";
    let shareLink = "";

    // --- לוגיקה 1: יצירת הזמנה חדשה עם ID Replacement ---
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      const [customer, type, warehouse, time, details] = createMatch[1].split('|').map(s => s.trim());
      
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .insert([{
          customer_name: customer,
          container_action: type,
          warehouse_source: warehouse,
          scheduled_time: time,
          order_id_comax: details,
          status: 'פתוח',
          created_by: 'Saban AI Brain',
          scheduled_date: new Date().toISOString().split('T')[0]
        }])
        .select();

      if (!insertError && inserted && inserted.length > 0) {
        const realId = inserted[0].id;
        const trackingUrl = `https://saban-os.vercel.app/track/${realId}`;
        
        // החלפת ה-TEMP_ID בלינק האמיתי בתוך תשובת ה-AI
        aiText = aiText.replace("TEMP_ID", realId);
        executionResult = `✅ הזמנה נוצרה בהצלחה. ID: ${realId}`;
        shareLink = trackingUrl;
      } else {
        executionResult = `❌ שגיאה ביצירה: ${insertError?.message}`;
      }
    }

    // --- לוגיקה 2: עדכון הזמנה קיימת ---
    const updateMatch = aiText.match(/\[UPDATE_ORDER:(.*?)\]/);
    if (updateMatch) {
      const [customer, field, value] = updateMatch[1].split('|').map(s => s.trim());
      const mapping: any = { 
        'סטטוס': 'status', 'נהג': 'driver_name', 
        'שעה': 'scheduled_time', 'פרטים': 'order_id_comax' 
      };
      
      const { error: updateError } = await supabaseAdmin
        .from('saban_master_dispatch')
        .update({ [mapping[field] || field]: value })
        .ilike('customer_name', `%${customer}%`);

      executionResult = updateError ? `❌ שגיאה בעדכון: ${updateError.message}` : `✅ עודכן: ${customer}`;
    }

    // שמירת היסטוריית שיחה וביצועים
    await supabaseAdmin.from('saban_brain_history').insert([{
      user_query: query,
      ai_response: aiText,
      execution_status: executionResult
    }]);

    return NextResponse.json({
      aiResponse: aiText,
      executionResult,
      shareLink,
      latency: `${Date.now() - startTime}ms`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
