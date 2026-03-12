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

    // --- 1. חיפוש מוצר חכם ---
    const cleanSearch = lastUserMsg.replace(/[?？]/g, "").trim();
    
    const [configRes, settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.%${cleanSearch}%,sku.ilike.%${cleanSearch}%,search_text.ilike.%${cleanSearch}%`)
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // מנגנון גיבוי לחיפוש אם המילה הראשונה קיימת
    if (!product && cleanSearch.includes(" ")) {
      const firstWord = cleanSearch.split(" ")[0];
      const fallbackSearch = await supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${firstWord}%`)
        .limit(1)
        .maybeSingle();
      if (fallbackSearch.data) product = fallbackSearch.data;
    }

    // --- 2. בניית ה-DNA המאוחד ---
    const rulesDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "";

    const settingsDNA = settingsRes.data?.content || "";
    const finalDNA = `${settingsDNA}\n${rulesDNA}`;

    // --- 3. ניהול מפתחות ומודלים ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').map(k => k.trim()).filter(k => k.length > 10);
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-3-flash-preview"];
    
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
              ### STRICT RULES (חוקי הברזל) ###
              ${finalDNA}
              
              ### PRODUCT DATA (JSON) ###
              ${product ? JSON.stringify(product) : "STATUS: NO_PRODUCT_FOUND"}

              ### EXECUTION PROTOCOL ###
              1. IF PRODUCT: הצג אך ורק כרטיס מוצר ויזואלי בראש התשובה.
              2. פרמטרים חובה בכרטיס: שם מוצר, image_url, מחיר, מק"ט, ותכונות (זמן ייבוש/יישום מה-JSON).
              3. לינק: השתמש אך ורק ב-Placeholder: MAGIC_URL.
              4. חישוב: אם הלקוח ביקש כמויות, בצע חישוב לפי נתוני ה-Coverage ב-JSON או לפי חוק הגבס (3 מ"ר ללוח).
              5. סגנון: ישיר, מקצועי, ללא משפטי נימוס מיותרים.
              
              חתימה מחייבת: תודה שבחרת בח.סבן חומרי בניין | ח.סבן חומרי בנין התלמיד 6 הוד השרון
            `
          });

          const result = await model.generateContent(lastUserMsg);
          const responseText = result.response.text();
          if (responseText) {
            aiResponse = responseText;
            success = true;
          }
        } catch (e) {
          console.warn(`Switching due to error...`);
        }
      }
    }

    // --- 4. הזרקת לינק הקסם ---
    if (product) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
      const magicUrlRegex = /MAGIC_URL/gi; 

      if (magicUrlRegex.test(aiResponse)) {
        aiResponse = aiResponse.replace(magicUrlRegex, finalLink);
      } else if (!aiResponse.includes(finalLink)) {
        aiResponse += `\n\n🔗 לצפייה במוצר: ${finalLink}`;
      }
    }

    // --- 5. עדכון פייפליין וחזרה ---
    if (phone && aiResponse) {
      const cleanPhone = phone.replace(/\D/g, '');
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), {
        text: aiResponse,
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse, product });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
