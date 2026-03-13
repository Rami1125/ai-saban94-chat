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

    // --- 1. אופטימיזציה של שאילתת החיפוש (Fuzzy & Tokenized Search) ---
    const cleanSearch = lastUserMsg.replace(/[?？!]/g, "").trim();
    const searchWords = cleanSearch.split(/\s+/).filter(word => word.length > 2);
    
    // יצירת מערך Postgres תקני: עטיפה בגרשיים כפולים לטיפול ברווחים
    const flexibleSearch = searchWords.length > 0 
      ? `{${searchWords.map(word => `"%${word}%"`).join(',')}}`
      : `{"%${cleanSearch}%"}`;

    const [configRes, settingsRes, inventoryRes] = await Promise.all([
      supabase.from('system_rules').select('instruction, agent_type, is_active'),
      supabase.from('system_settings').select('content').eq('key', 'saban_ai_dna').maybeSingle(),
      supabase.from('inventory')
        .select('*')
        .or(`product_name.ilike.any(${flexibleSearch}),search_text.ilike.any(${flexibleSearch}),sku.ilike.%${cleanSearch}%`)
        .order('stock_quantity', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    let product = inventoryRes.data;

    // --- 2. מנגנון Fallback - חיפוש לפי מילה ראשונה משמעותית ---
    if (!product && searchWords.length > 0) {
      const { data: fallback } = await supabase.from('inventory')
        .select('*')
        .ilike('product_name', `%${searchWords[0]}%`)
        .limit(1)
        .maybeSingle();
      if (fallback) product = fallback;
    }

    // --- 3. איחוד מוחות (DNA Configuration) ---
    const rulesDNA = configRes.data
      ?.filter(r => r.agent_type === 'executor' && r.is_active)
      .map(r => r.instruction)
      .join("\n") || "";

    const settingsDNA = settingsRes.data?.content || "";
    
    const finalDNA = `
      ${settingsDNA}
      ---
      STRICT_EXECUTION_RULES:
      ${rulesDNA}
      ---
      CLIENT_CONTEXT:
      - PHONE: ${phone || 'unknown'}
      - SEARCH_QUERY: ${cleanSearch}
    `.trim();

    // --- 4. ניהול מפתחות וסבב מודלים ---
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
              ### DNA מחייב (חוקי הברזל) ###
              ${finalDNA}
              
              ### נתוני מלאי בזמן אמת (JSON) ###
              ${product ? JSON.stringify(product) : "סטטוס: מוצר לא נמצא במערכת"}
// בתוך פונקציית ה-POST של ה-Chat API שלך
// System Instruction מעודכן ומקודד לביצועים
const response = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  systemInstruction: `
    ### DNA מחייב (חוקי הברזל) ###
    ${finalDNA}
    
    ### נתוני מלאי בזמן אמת (JSON) ###
    ${product ? JSON.stringify(product) : "סטטוס: מוצר לא נמצא במערכת"}

    ### פרוטוקול מענה - סדר פעולות מחייב: ###
    
    1. **תצוגה ויזואלית (UI First)**: 
       אם נמצא מוצר ב-JSON, התשובה חייבת להיפתח בהפעלת רכיב ה-ProductStoreCard. וודא שכל השדות (image_url, youtube_id) מוזרקים כראוי.

    2. **מפרט טכני (Data Extraction)**:
       חלץ והצג בצורה בולטת (בולטים) את הנתונים הבאים מתוך ה-JSON בלבד:
       - ⏳ זמן ייבוש: {drying_time}
       - 🛠️ שיטת יישום: {application_method}
       - ✨ תכונות עיקריות: {features}

    3. **מנוע חישוב (Calculations)**:
       במידה והמשתמש ציין שטח (מ"ר), בצע חישוב אוטומטי כולל פחת:
       - לוחות גבס: שטח חלקי 3 = מספר לוחות. (הוסף 5% פחת ועגל למעלה).
       - דבק/פלסטומר 603: שטח כפול 5 ק"ג = סה"כ משקל. (חלק ב-25 לקבלת מספר שקים).

    4. **בקרת לינקים**:
       לינק חיצוני יחיד מותר: ה-MAGIC_URL מה-JSON. אל תוסיף טקסט לינק ידני, הטמע אותו בכפתור ה-UI.

    5. **סגנון וטון**:
       - ללא הקדמות בסגנון "שלום" או "הנה המידע". 
       - כתיבה סמכותית, קצרה מאוד, של "מתכנת אומנותי".
       - שפה: עברית פשוטה ומקצועית.

    ### חתימת מערכת (סעיף 6) ###
    ראמי, הכל מוכן לביצוע. מחכה לפקודה. 🦾
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

    // --- 5. הזרקת לינקים ו-Final Polish ---
    if (product) {
      const finalLink = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
      aiResponse = aiResponse.replace(/MAGIC_URL/gi, finalLink);
    }

    // --- 6. עדכון לוג ה-Pipeline ---
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
    console.error("Critical System Failure:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
