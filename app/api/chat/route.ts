import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content?.toString().trim() || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    // --- שלב 1: זיהוי שטח לחישוב "חוק סיקה" ---
    const areaMatch = lastMsg.match(/(\d+(?:\.\d+)?)\s*(?:מ"ר|sqm|m2|m\^2)/i);
    const areaM2 = areaMatch ? parseFloat(areaMatch[1]) : null;

    // --- שלב 2: מנגנון חיפוש היברידי (The Investigator) ---
    let products: any[] = [];
    
    // ניקוי ראשוני לחיפוש
    const cleanSearch = lastMsg.replace(/(גימני|אחי|שלום|צריך|כמה|עולה|תביא|לי|בבקשה)/g, "").trim();
    const isSkuPattern = /^[A-Z0-9-]{3,}$/i.test(cleanSearch);

    // 1. מסלול SKU (Exact/Prefix)
    if (isSkuPattern) {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(`sku.eq.${cleanSearch},sku.ilike.${cleanSearch.replace(/-/g, "")}%`)
        .limit(1);
      if (data?.length) products = data;
    }

    // 2. מסלול FTS (Full Text Search) - אם לא נמצא SKU
    if (products.length === 0) {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .textSearch("search_tsv", cleanSearch, { config: "simple", type: "websearch" })
        .limit(1);
      if (data?.length) products = data;
    }

    // 3. מסלול Trigrams / Fuzzy (אם עדיין אין תוצאה)
    if (products.length === 0) {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(`product_name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`)
        .limit(1);
      if (data?.length) products = data;
    }

    // --- שלב 3: הפעלת המוח (Gemini 3.1 Flash) ---
    const googleAI = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    // חישוב חוק סיקה אם יש שטח
    let sikaLawResult = "";
    if (areaM2) {
      const units = Math.ceil((areaM2 * 4) / 25 + 1);
      sikaLawResult = `עבור <b>${areaM2} מ"ר</b> ⇒ <b>${units} יח'</b>`;
    }

    const { text } = await generateText({
      model: googleAI("gemini-1.5-flash"), // מודל יציב ל-Logic
      system: `אתה עוזר שירות "ח. סבן". 
      נתוני מוצר מ-Supabase: ${JSON.stringify(products)}.
      הנחיות פלט:
      1. השתמש ב-HTML בלבד: <b>, <ul>, <li>, <br>.
      2. אם נמצא מוצר (${products.length > 0}), הצג שם ו-SKU מודגשים.
      3. אם יש חישוב שטח, הצג: <b>חוק סיקה:</b> ${sikaLawResult}.
      4. אם לא נמצא מוצר, הצע 2 וריאנטים לחיפוש (למשל עם/בלי מקף).
      5. אל תמציא מחירים. אם חסר מחיר, כתוב "פנה להצעת מחיר".`,
      messages,
      temperature: 0.1
    });

    // --- שלב 4: הפקת JSON כרטיס מוצר (uiBlueprint) ---
    const uiBlueprint = products.length > 0 ? {
      type: "product_card",
      data: {
        title: products[0].product_name,
        price: products[0].price || null,
        image: products[0].image_url || null,
        sku: products[0].sku,
        supplier: products[0].supplier_name || "ח. סבן",
        specs: {
          coverage: products[0].coverage || products[0].coverage_per_sqm || "לפי מפרט",
          drying: products[0].drying_time || "24 שעות",
          method: products[0].application_method || "הברשה/מאלאג'"
        }
      }
    } : null;

    return Response.json({ 
      text: text.trim(), 
      uiBlueprint,
      debug: { searchType: products.length > 0 ? "Found" : "Not Found", cleanSearch } 
    });

  } catch (error: any) {
    return Response.json({ text: "שגיאה במערכת החיפוש." }, { status: 500 });
  }
}
