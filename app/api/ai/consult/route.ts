import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { getRTDB } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // --- 1. אופטימיזציה של שאילתת החיפוש (סידור + מלאי) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter(word => word.length > 2);
    const flexibleSearch = searchWords.length > 0 
      ? `{${searchWords.map(word => `"%${word}%"`).join(',')}}`
      : `{"%${cleanSearch}%"}`;

    // שליפת נתונים מרובה: חוקים, סידור עבודה ומלאי
    const [configRes, settingsRes, inventoryRes, dispatchRes, customRulesRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any(${flexibleSearch}),search_text.ilike.any(${flexibleSearch}),sku.ilike.%${cleanSearch}%`)
        .limit(1).maybeSingle(),
      supabase.from('saban_dispatch').select('*').limit(30), // נתוני סידור
      supabase.from('ai_rules').select('instruction').eq('is_active', true) // חוקי החינוך שלך
    ]);

    let product = inventoryRes.data;
    const currentSchedule = dispatchRes.data || [];
    const trainingRules = customRulesRes.data?.map(r => r.instruction).join("\n") || "";

    // --- 2. איחוד מוחות (DNA Configuration) ---
    const rulesDNA = configRes.data?.filter(r => r.agent_type === 'executor' && r.is_active).map(r => r.instruction).join("\n") || "";
    const settingsDNA = settingsRes.data?.content || "";
    
    const finalDNA = `
      ${settingsDNA}
      ---
      SABAN_LOGISTICS_RULES (DNA):
      ${trainingRules}
      ---
      STRICT_EXECUTION_RULES:
      ${rulesDNA}
      ---
      CURRENT_DISPATCH_DATA (JSON):
      ${JSON.stringify(currentSchedule)}
    `.trim();

    // --- 3. ניהול מפתחות וסבב מודלים מעודכן ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    let aiResponse = "";
    let success = false;

    for (const key of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(key);
      
      for (const modelName of modelPool) {
        if (success) break;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ### DNA מחייב של ח. סבן ###
              ${finalDNA}
              
              ### הנחיות קריטיות לסידור ###
              1. חכמת (מנוף): רק מחרש 10, עד 12 טון, 10 מטר מנוף.
              2. עלי (ידני): כל הסניפים + העברות. חובה לבקש מספר תעודה להעברה.
              3. חישוב: 60 דקות לסבב. בדוק חפיפת זמנים בנתוני הדיספאץ'.
              4. מלאי: אם נמצא מוצר (${product?.product_name || 'אין'}), הצג מחיר ומלאי.
              5. סגנון: קצר, מקצועי, ללא "חפירות".
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.error(`Error with ${modelName}:`, e);
        }
      }
    }

    // --- 4. עדכון לוג וצינור ווטסאפ ---
    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse, product, success: true });

  } catch (error) {
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
