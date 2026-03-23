import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
// פונקציית בדיקת תקינות צנרת (Database Diagnostics)
async function testAllTables() {
  const tables = [
    'ai_rules', 
    'inventory', 
    'saban_master_dispatch', 
    'customer_memory', 
    'ai_knowledge_base', 
    'drivers', 
    'color_fans'
  ];

  const results = [];

  for (const table of tables) {
    const start = Date.now();
    const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
    
    results.push({
      table,
      status: error ? '❌ ERROR' : '✅ OK',
      duration: `${Date.now() - start}ms`,
      error: error ? error.message : null,
      hasData: data && data.length > 0 ? 'Yes' : 'Empty Table'
    });
  }

  return results;
}
export async function POST(req: Request) {
  const logId = crypto.randomUUID();
  const start = Date.now();

  const report = async (step: string, data: any) => {
    await supabaseAdmin.from('saban_debug_logs').insert([{
      log_id: logId, step, payload: data, duration: Date.now() - start
    }]);
  };

  try {
    const { query, userName, history } = await req.json();
    await report("01_REQ_RECEIVED", { query, userName });

    // --- הזרקת הקשר (Context Injection) מכל הטבלאות ---
    
// 1. זיהוי אם המשתמש שאל על נהגים
let driversContext = "";
if (query.includes("נהג") || query.includes("נהגים")) {
    const { data: drivers, error: driverErr } = await supabaseAdmin
        .from('drivers')
        .select('full_name, vehicle_type, status');
    
    if (driverErr) {
        await report("DB_ERROR_DRIVERS", { msg: driverErr.message });
        driversContext = "שגיאה בשליפת נהגים מה-DB.";
    } else {
        driversContext = `נהגים אמיתיים מה-DB: ${JSON.stringify(drivers)}`;
        await report("DB_SUCCESS_DRIVERS", { count: drivers?.length });
    }
}

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", // המודל היציב והמהיר ביותר
      systemInstruction: `
        אתה המוח המבצע של ח. סבן. תפקידך: יועץ טכני, מנהל לוגיסטי ושותף של ראמי.
        חוק בל יעבור: אל תמציא שמות של נהגים או לקוחות! 
         השתמש אך ורק בנתונים הבאים שהגיעו מה-Database:
        חוקי ברזל לביצוע:
        - יצירת הזמנה לסידור: [CREATE_ORDER:לקוח|פעולה|מחסן|שעה|פירוט]
        - הצגת כרטיס מוצר פרימיום: [SHOW_PRODUCT:SKU]
        - חישוב כמויות: הוסף תמיד 10% פחת בייעוץ טכני.
        
        הקשר נוכחי:
        - DNA של העסק: ${dna?.map(r => r.instruction).join(" | ")}
        - ידע על הלקוח: ${memory?.accumulated_knowledge || "לקוח חדש"}
        - ידע טכני מה-KB: ${kb?.map(k => k.question + ": " + k.answer).join(" | ")}
        - ${inventoryContext}
          אם הנתונים למעלה ריקים, תגיד: 'ראמי אחי, הטבלה ב-DB ריקה, אין נהגים רשומים'.
        ענה בעברית פשוטה, מקצועית, כמו אח ושותף.
      `
    });

    const result = await model.generateContent(query);
    const aiText = result.response.text();
    await report("02_AI_GENERATED", { aiText });

    // --- לוגיקת עיבוד פקודות (Command Processor) ---
    
    let productData = null;

    // 1. זיהוי פקודת הצגת מוצר (ל-ProductCard)
    const productMatch = aiText.match(/\[SHOW_PRODUCT:(.*?)\]/);
    if (productMatch) {
      const sku = productMatch[1].trim();
      const { data: product } = await supabaseAdmin.from('inventory').select('*').eq('sku', sku).single();
      if (product) {
        productData = product;
        await report("03_PRODUCT_SENT", { sku });
      }
    }

    // 2. זיהוי פקודת יצירת הזמנה (Dispatch)
    const createMatch = aiText.match(/\[CREATE_ORDER:(.*?)\]/);
    if (createMatch) {
      await report("03_ORDER_FOUND", { raw: createMatch[1] });
      const p = createMatch[1].split('|').map(s => s.trim());
      
      const { error: dbErr } = await supabaseAdmin.from('saban_master_dispatch').insert([{
        customer_name: p[0], 
        container_action: p[1] || "אספקה", 
        warehouse_source: p[2] || "ראשי",
        scheduled_time: p[3] || "09:00", 
        order_id_comax: p[4] || "הזמנת AI", 
        status: 'פתוח',
        scheduled_date: new Date().toISOString().split('T')[0]
      }]);

      if (dbErr) await report("04_DB_ERROR", { msg: dbErr.message });
      else await report("04_DB_SUCCESS", { customer: p[0] });
    }

    // החזרת תשובה מלאה הכוללת את הטקסט ואת הנתונים המובנים
    return NextResponse.json({ 
      answer: aiText,
      product: productData // נתון זה ישמש את ה-Frontend להצגת ה-ProductCard
    });

  } catch (err: any) {
    console.error("Critical Error:", err.message);
    await report("ERROR_FATAL", { msg: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
