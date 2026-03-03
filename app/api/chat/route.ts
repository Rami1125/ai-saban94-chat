// app/api/assistant/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// ריצה כ-Edge (דינמי)
export const dynamic = "force-dynamic";

/**
 * טיפ אבטחה:
 *  - וודא שהמשתנים הבאים מוגדרים בסביבה (Server-side only):
 *    NEXT_PUBLIC_SUPABASE_URL
 *    SUPABASE_SERVICE_ROLE
 *    GOOGLE_GENERATIVE_AI_API_KEY
 */

type Msg = { role: "user" | "assistant" | "system"; content: string };

const MAX_MSG_LEN = 600;

// Stop-words בסיסיות בעברית (ניתן להרחיב)
const STOP_WORDS_HE = new Set([
  "גימני", "ג׳ימיני", "אחי", "שלום", "צריך", "כמה", "עולה",
  "תביא", "לי", "בבקשה", "אפשר", "תן", "תני", "יש", "יש לך",
  "מחיר", "מחירים", "כמה עולה", "במחיר"
]);

// זיהוי מותג/וריאנטים בסיסי
const BRAND_PAT = /(sika|סיקה|sikatop|סיקהטופ)/i;
// זיהוי מספר דגם (2–4 ספרות)
const NUM_PAT = /(\d{2,4})/;

/* ------------------------------ Utilities ------------------------------ */

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
    .filter((w) => w && !STOP_WORDS_HE.has(w) && w.length > 1);
  const clean = tokens.join(" ") || normalize(lastMsg);
  return clean.slice(0, MAX_MSG_LEN);
}

function looksLikeSKU(q: string) {
  // הגדרה שמרנית למק״ט: תווים אלפאנומריים + מקפים/נקודות/קו תחתון
  return /^[a-z0-9\-_.]{3,}$/i.test(q) && /[0-9]/.test(q);
}

function hasQuotes(q: string) {
  // בדיקה פשוטה לנוכחות פראזה במרכאות
  return /"[^"]{2,}"/.test(q) || /„[^„]{2,}”/.test(q);
}

function extractAreaM2(text: string): number | null {
  // מזהה תבניות כמו: "12 מ״ר", "12m2", "12 sqm"
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:מ\"?ר|m2|sqm)/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  return isNaN(val) ? null : val;
}
const sikaFormulaUnits = (m2: number) => Math.ceil((m2 * 4) / 25 + 1); // חוק סיקה

/**
 * מייצר וריאנטים לשאילתה:
 *  - websearch (ל-FTS עם מרכאות/AND)
 *  - like (לטרייאגרמות)
 *  - sku (וריאנטים של מק״ט: עם/בלי מקף; prefix)
 */
function buildQueryVariants(q: string) {
  const nq = normalize(q);
  const mBrand = nq.match(BRAND_PAT);
  const mNum = nq.match(NUM_PAT);

  const variants: { websearch: string[]; like: string[]; sku: string[] } = {
    websearch: [],
    like: [nq, nq.replace(/-/g, " "), nq.replace(/\s+/g, "-")],
    sku: [nq, nq.replace(/-/g, ""), nq.split(/\s+/)[0]]
  };

  // אם זיהינו מותג+מספר — נייצר פראזות ווריאנטים
  if (mBrand && mNum) {
    const brand = mBrand[1].toLowerCase().replace(/\s+/g, " ");
    const num = mNum[1];

    // פראזות (ציטוטים) עבור websearch_to_tsquery
    variants.websearch.push(`"${brand} ${num}"`);
    // גם AND פשוט (למקרה שהטקסט אינו פראזה אבל קיים רצף)
    variants.websearch.push(`${brand} ${num}`);

    // טרייאגרמות – עם/בלי מקף/צמוד
    variants.like.push(`${brand} ${num}`, `${brand}-${num}`, `${brand}${num}`);
  }

  // ייחוד וריאנטים
  variants.websearch = Array.from(new Set(variants.websearch));
  variants.like = Array.from(new Set(variants.like));
  variants.sku = Array.from(new Set(variants.sku));
  return variants;
}

/* ------------------------------ Hybrid Search ------------------------------ */

async function hybridSearch(supabase: any, cleanSearch: string) {
  const v = buildQueryVariants(cleanSearch);

  // 1) SKU – exact / prefix / גרסאות ללא מקף
  {
    const skuOrs = [
      `sku.eq.${cleanSearch}`,
      `sku.ilike.${cleanSearch}%`,
      `sku.eq.${cleanSearch.replace(/-/g, "")}`,
      `sku.ilike.${cleanSearch.replace(/-/g, "")}%`
    ].join(",");
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .or(skuOrs)
      .limit(1);
    if (error) console.warn("SKU search error:", error);
    if (data?.length) return data;
  }

  // 2) FTS (websearch) על search_tsv — מנסה כמה וריאנטים
  {
    const candidates = v.websearch.length ? v.websearch : [cleanSearch];
    for (const wq of candidates) {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .textSearch("search_tsv", wq, { type: "websearch" })
        .limit(1);
      if (error) console.warn("FTS search error:", { wq, error });
      if (data?.length) return data;
    }
  }

  // 3) טרייאגרמות (LIKE/ILIKE) על עמודות מנורמלות + SKU
  {
    const likeTerms = v.like.length ? v.like : [cleanSearch];
    const clauses: string[] = [];
    for (const t of likeTerms) {
      // ilike על name_norm / desc_norm / sku
      clauses.push(`product_name_norm.ilike.%${t}%`);
      clauses.push(`description_norm.ilike.%${t}%`);
      clauses.push(`sku.ilike.%${t}%`);
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .or(clauses.join(","))
      .limit(1);
    if (error) console.warn("TRGM search error:", error);
    if (data?.length) return data;
  }

  return [];
}

/* ------------------------------ Route Handler ------------------------------ */

export async function POST(req: NextRequest) {
  try {
    // בדיקות סביבה הכרחיות
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !GEMINI_API_KEY) {
      console.error("Missing env vars (Supabase/Gemini)");
      return Response.json({ text: "שגיאה בהגדרות שרת (env)." }, { status: 500 });
    }

    // פרסינג הודעה אחרונה
    const body = await req.json();
    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const rawText = messages[messages.length - 1]?.content?.toString() ?? "";
    const lastMsg = rawText.trim().slice(0, MAX_MSG_LEN);
    const cleanSearch = extractSearch(lastMsg);

    // Supabase (שרת)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Pipeline חיפוש היברידי
    const products = await hybridSearch(supabase, cleanSearch);

    // חישוב חוק סיקה (אם הוזן שטח)
    const areaM2 = extractAreaM2(lastMsg);
    const sikaCalc = areaM2 != null ? sikaFormulaUnits(areaM2) : null;

    // UI Blueprint (כרטיס מוצר)
    const product = products?.[0] ?? null;
    const uiBlueprint =
      product
        ? {
            type: "product_card",
            data: {
              title: product.product_name,
              price: product.price ?? null,
              image: product.image_url ?? null,
              sku: product.sku,
              supplier: product.supplier_name ?? null,
              specs: {
                coverage: product.coverage ?? product.coverage_per_sqm ?? null,
                drying: product.drying_time ?? null,
                method: product.application_method ?? null
              }
            }
          }
        : null;

    // הכנה ל‑Gemini: הנחיות קצרות ו"עוגנים" מהדאטה
    const googleAI = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
    const models = [
      "gemini-3.1-pro-preview",
      "gemini-3.1-flash-image-preview",
      "gemini-3-flash-preview"
    ];

    const systemPrompt = [
      `את/ה מנהל/ת מכירות של "ח. סבן". ענה/י תמציתי ב‑HTML (מותר <b>, <ul>, <li>, <br>).`,
      `העדף/י מידע אמיתי מ‑Supabase על פני אלתור.`,
      `אם נמצא מוצר: הדגש/י שם + SKU, מחיר אם קיים, והוסף/י 2 תבליטים (כיסוי/ייבוש/שיטת יישום).`,
      `אם המשתמש ציין שטח במ״ר — בצע/י "חוק סיקה": (שטח*4)/25 + 1 (רזרבה) והדגש/י.`,
      `אם price=null — כתוב/כתבי "פנה/י להצעת מחיר".`,
      `אם לא נמצא מוצר: הצע/י 2 ניסוחים אלטרנטיביים (עם/בלי מקף/תעתיק), בלי להמציא נתוני מלאי.`
    ].join("\n");

    const stockHint = product
      ? "זמין במלאי. מציג/ה כרטיס מוצר למטה."
      : "לא נמצא מוצר תואם חד־משמעית.";
    const sikaLine = sikaCalc != null
      ? `חישוב "חוק סיקה": עבור ${areaM2} מ״ר → <b>${sikaCalc} יח׳</b>.`
      : "";

    const userContext = [
      `<b>תמצית מלאי:</b> ${product ? "נמצא פריט." : "לא נמצא."} ${stockHint}`,
      product ? `שם: ${product.product_name} | SKU: ${product.sku}` : "",
      sikaLine
    ].filter(Boolean).join("<br>");

    let responseText = "";
    for (const modelId of models) {
      try {
        const { text } = await generateText({
          model: googleAI(modelId),
          system: systemPrompt,
          messages: [
            ...messages,
            { role: "system", content: userContext }
          ],
          temperature: 0.2
        });
        if (text) { responseText = text; break; }
      } catch (e) {
        console.warn("Gemini model failed, trying next:", modelId, e);
        continue;
      }
    }

    // תשובת ברירת מחדל אם LLM לא החזיר
    if (!responseText) {
      responseText =
        product
          ? `<b>${product.product_name}</b> (SKU: ${product.sku})<br>${sikaLine || ""}`
          : `<b>לא נמצא מוצר תואם</b><br>נסה/י: "סיקה 107", "Sika 107", "SikaTop-107"`;
    }

    return Response.json({
      text: responseText,
      products: products ?? [],
      uiBlueprint
    });

  } catch (error) {
    console.error("assistant route error:", error);
    return Response.json(
      { text: "שגיאה בחיבור למערכת סבן AI." },
      { status: 500 }
    );
  }
}
