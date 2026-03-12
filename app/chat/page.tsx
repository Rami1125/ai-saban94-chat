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

    // חיפוש DNA ומלאי
    const [configRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('inventory')
        .select('product_name, stock_quantity, product_magic_link, sku')
        .or(`product_name.ilike.%${lastUserMsg}%,sku.ilike.%${lastUserMsg}%`)
        .limit(1)
        .maybeSingle()
    ]);

    const executorDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "נציג מכירות ח. סבן";

    const foundProduct = inventoryRes.data;

    // מפתחות ורוטציה - מעודכן למרץ 2026
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    
    // שימוש במודלים החדשים ביותר לפי רשימת העדכונים
    const modelPool = [
      "gemini-3.1-flash-lite-preview", // המודל החדש מ-3 במרץ
      "gemini-3.1-pro-preview"        // המודל החזק מ-19 בפברואר
    ];

    let aiResponse = "";
    let success = false;

    for (const apiKey of keys) {
      if (success) break;
      const genAI = new GoogleGenerativeAI(apiKey);
      
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `
              ${executorDNA}
              מוצר במלאי: ${foundProduct ? foundProduct.product_name : "לא זוהה"}
              חתימה: H.SABAN 1994
            `
          });

          const result = await model.generateContent(lastUserMsg);
          aiResponse = result.response.text();
          if (aiResponse) { success = true; break; }
        } catch (e) { continue; }
      }
    }

    // Pipeline ל-RTDB
    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
