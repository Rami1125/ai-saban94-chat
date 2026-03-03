// app/api/assistant/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

type Msg = { role: "user"|"assistant"|"system"; content: string };

const STOP_WORDS_HE = new Set([
  "גימני","ג׳ימיני","אחי","שלום","צריך","כמה","עולה","תביא","לי","בבקשה",
  "אפשר","תן","תני","יש","יש לך","מחיר","מחירים","כמה עולה","במחיר"
]);
const MAX_MSG_LEN = 600; // הגבלת קלט

function normalize(q: string) {
  // נורמליזציה רכה: lowercase, החלפת מפרידים לרווח, דילול רווחים
  return q
    .toLowerCase()
    .replace(/[-–—_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearch(lastMsg: string) {
  const tokens = normalize(lastMsg)
    .split(" ")
    .filter(w => w && !STOP_WORDS_HE.has(w) && w.length > 1);
  const clean = tokens.join(" ") || normalize(lastMsg);
  return clean.slice(0, MAX_MSG_LEN); // הגבלת אורך
}

function looksLikeSKU(q: string) {
  // כלל פשוט: אותיות-ספרות-מקפים (לדוגמה: SIKA-107-BG)
  return /^[a-z0-9\-_.]{3,}$/i.test(q) && /[0-9]/.test(q);
}

function hasQuotes(q: string) {
  return /"[^"]{2,}"/.test(q) || /„[^„]{2,}”/.test(q);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const rawText = messages[messages.length - 1]?.content?.toString() ?? "";
    const lastMsg = rawText.trim().slice(0, MAX_MSG_LEN);
    const cleanSearch = extractSearch(lastMsg);

    // --- Supabase (Server-side only) ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    );

    // ============================================================
    // 1) מסלול SKU (Exact / Prefix)
    // ============================================================
    let products: any[] = [];
    if (looksLikeSKU(cleanSearch)) {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(`sku.eq.${cleanSearch},sku.ilike.${cleanSearch}%`)
        .limit(1);
      if (data?.length) products = data;
    }

    // ============================================================
    // 2) מסלול FTS (אם אין פגיעה עדיין) — websearch_to_tsquery
    //    * דורש עמודת search_tsv (tsvector) + אינדקס GIN.
    //    * מרכאות → phrase ("sika 107")
    // ============================================================
    if (products.length === 0 && cleanSearch) {
      // websearch: מאפשר "ציטוטים", OR/-, וכו'
      // דוגמה: .textSearch('search_tsv', '"sika 107"', { type: 'websearch' })
      // אם אין מרכאות, עדיין פרסינג websearch נותן AND בין מילים.
      const query = hasQuotes(cleanSearch)
        ? cleanSearch
        : cleanSearch; // אפשר לגזור כאן גם וריאנטים, אם רוצים.

      const { data } = await supabase
        .from("inventory")
        .select("*")
        .textSearch("search_tsv", query, { type: "websearch" })
        .limit(1);

      if (data?.length) products = data;
    }

    // ============================================================
    // 3) Fallback טרייאגרמות (LIKE %...%) מאיץ ע"י gin_trgm_ops
    //    * דורש product_name_norm / description_norm + אינדקסים GIN.
    // ============================================================
    if (products.length === 0 && cleanSearch) {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(
          [
            `product_name_norm.ilike.%${cleanSearch}%`,
            `description_norm.ilike.%${cleanSearch}%`,
            `sku.ilike.%${cleanSearch}%`
          ].join(",")
        )
        .limit(1);

      if (data?.length) products = data;
    }

    // ============================================================
    // 4) חישוב "חוק סיקה" אם המשתמש סיפק שטח (נחלץ מספר מ"חדר 12 מ״ר" למשל)
    //    חוק: (שטח * 4) / 25 + 1 רזרבה  → נעגל מעלה
    // ============================================================
    function extractAreaM2(text: string): number | null {
      const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:מ\"?ר|m2|sqm)/i);
      if (!m) return null;
      const val = parseFloat(m[1].replace(",", "."));
      return isNaN(val) ? null : val;
    }
    const areaM2 = extractAreaM2(lastMsg);
    const sikaFormula = (m2: number) => Math.ceil((m2 * 4) / 25 + 1);

    // ============================================================
    // 5) בניית UI Blueprint (כרטיס מוצר)
    // ============================================================
    const uiBlueprint =
      products && products.length > 0
        ? {
            type: "product_card",
            data: {
              title: products[0].product_name,
              price: products[0].price ?? null,
              image: products[0].image_url ?? null,
              sku: products[0].sku,
              supplier: products[0].supplier_name ?? null,
              // שדות מוצר אופציונליים מתוך הסכמה שלך:
              specs: {
                coverage: products[0].coverage ?? products[0].coverage_per_sqm ?? null,
                drying: products[0].drying_time ?? null,
                method: products[0].application_method ?? null
              }
            }
          }
        : null;

    // ============================================================
    // 6) הכנה לתשובת Gemini — Prompt קצר, בטוח, HTML מינימלי
    // ============================================================
    const product = products?.[0] ?? null;
    const stockHint = product ? "זמין במלאי. מציג/ה כרטיס מוצר למטה." : "לא נמצא מוצר תואם חד־משמעית.";
    const sikaCalc =
      areaM2 != null ? `לפי "חוק סיקה": עבור ${areaM2} מ״ר → ${sikaFormula(areaM2)} יח׳ (כולל רזרבה).` : "";

    const systemPrompt = [
      `את/ה מנהל/ת מכירות של "ח. סבן". ענה/י תמציתי ב‑HTML (מותר <b>, <ul>, <li>, <br>).`,
      `העדף/י מידע מהשדות שחולצו מול Supabase על פני אלתור.`,
      `אם נמצא מוצר: הדגש/י שם + SKU, מחיר אם יש, והוסף/י שני תבליטים מתוך specs (כיסוי/ייבוש/שיטה).`,
      `אם המשתמש ציין שטח במ״ר — בצע/י חישוב "חוק סיקה": (שטח*4)/25 + 1 (רזרבה) והדגש/י.`,
      `הימנע/י ממחירים מדויקים אם price=null; ציין/י "פנה/י להצעת מחיר" במקום.`,
      `אם לא נמצא מוצר: הצע/י 2 וריאנטים לניסוח חיפוש (עם/בלי מקף/תעתיק).`
    ].join("\n");

    const userContext = [
      `<b>תמצית מלאי:</b> ${product ? "נמצא פריט." : "לא נמצא."} ${stockHint}`,
      product ? `שם: ${product.product_name} | SKU: ${product.sku}` : "",
      sikaCalc
    ].filter(Boolean).join("<br>");

    const googleAI = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
    });

    const models = [
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview"
    ];

    let responseText = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: systemPrompt,
          // משמרים את ההיסטוריה, אך מוסיפים הקשר עובדתי קצר עם תוצאת החיפוש
          messages: [
            ...messages,
            { role: "system", content: userContext }
          ],
          temperature: 0.2,
        });
        if (text) { responseText = text; break; }
      } catch {
        // ממשיכים למודל הבא
      }
    }

    return Response.json({
      text: responseText || `<b>לא נמצא מוצר תואם</b><br>נסה/י: "סיקה 107", "Sika 107", "SikaTop-107"`,
      products: products ?? [],
      uiBlueprint
    });

  } catch (error) {
    console.error("assistant route error:", error);
    return Response.json({ text: "שגיאה בחיבור למערכת סבן AI." }, { status: 500 });
  }
}
