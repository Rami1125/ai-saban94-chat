import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// חיבור מאובטח ל-Supabase עם Service Role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { query, history = [] } = await req.json(); // חזרה למבנה המקורי שלך
    const apiKey = process.env.GOOGLE_AI_KEY;
    const MODEL_NAME = "gemini-3.1-flash-lite-preview"; // המודל המדויק שלך

    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    // --- 1. שליפת ה-DNA של המוחות מה-DB ---
    const { data: rawRules } = await supabaseAdmin
      .from('saban_brain_rules')
      .select('brain_type, rule_description')
      .eq('is_active', true);

    const brainRules = rawRules?.map(r => {
      return `[${r.brain_type} BRAIN]: ${JSON.stringify(r.rule_description)}`;
    }).join('\n') || "עבוד לפי חוקי ח. סבן הכלליים.";

    // --- 2. שליפת מלאי רלוונטי מה-CSV שהומר לטבלה ---
    const { data: inventory } = await supabaseAdmin
      .from('inventory')
      .select('product_name, sku, stock_qty, unit_type, coverage_notes')
      .limit(15);

    const inventoryContext = inventory?.map(i => 
      `${i.product_name} (SKU: ${i.sku}) | מלאי: ${i.stock_qty} | יחידה: ${i.unit_type} | כיסוי: ${i.coverage_notes}`
    ).join('\n');

    // --- 3. בניית ה-System Prompt המאוחד ---
    const systemPrompt = `
אתה המוח המשולב של ח. סבן (Multi-Brain System). אתה פועל כיחידה אחת המורכבת מ-3 זהויות:

חוקי המוחות (DNA מה-Database):
${brainRules}

מלאי זמין (CSV Sync):
${inventoryContext}

⚠️ חוקי ברזל לביצוע (אל תסטה מהם):
1. בכל פעם שיש בקשה לכמות, הפעל את ENGINEER: חשב נטו + 10% פחת בדיוק. אל תיתן מספרים נמוכים מהחישוב הזה.
2. בכל הזמנה, הפעל את CUSTOMER: בצע Upsell אקטיבי. אל תשאל "האם אתה רוצה", כתוב "אני מוסיף לך לסל [מוצר משלים] כי זה הכרחי לעבודה".
3. בכל פעם שנסגרת כמות וזמן, חובה להוציא פקודה בפורמט הבא בתוך הטקסט:
   [CREATE_ORDER:שם_לקוח|סוג_פעולה|מחסן|שעה|פרטים_טכניים]
   [ADD_TO_CART:SKU_או_שם_מוצר]

הנחיות סגנון:
- פנה בשמות: "ראמי", "בר", "אחי".
- חתימה חובה: "הנה הלינק למעקב אישי עבור הלקוח: https://saban-os.vercel.app/track/TEMP_ID"
- אם הלקוח שאל על חומר, תן לו את המק"ט המדויק מהמלאי לעיל.
    `;
    // --- 4. שליחה ל-Gemini API ---
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...history, { role: "user", parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      }),
    });

    const aiData = await res.json();
    let aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "ראמי אחי, יש נתק קטן בכיול, נסה שוב... 🦾";
    let executionResult = "NO_ACTION";
    let shareLink = "";

    // --- 5. עיבוד פקודות (Create/Update) ---
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      const [customer, type, warehouse, time, details] = createMatch[1].split('|').map(s => s.trim());
      const { data: inserted } = await supabaseAdmin.from('saban_master_dispatch').insert([{
          customer_name: customer,
          container_action: type,
          warehouse_source: warehouse,
          scheduled_time: time,
          order_id_comax: details,
          status: 'פתוח',
          scheduled_date: new Date().toISOString().split('T')[0]
      }]).select();

      if (inserted?.[0]) {
        const realId = inserted[0].id;
        aiText = aiText.replace("TEMP_ID", realId);
        executionResult = `✅ הזמנה נוצרה: ${realId}`;
        shareLink = `https://saban-os.vercel.app/track/${realId}`;
      }
    }

    // שמירה להיסטוריה
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
