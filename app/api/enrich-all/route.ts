import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. שליפת מוצרים ללא תמונה
    const { data: missingProducts } = await supabase
      .from('inventory')
      .select('sku, product_name')
      .is('image_url', null)
      .limit(5); // נתחיל ב-5 כדי לא לחרוג מה-Rate Limit שלך

    if (!missingProducts || missingProducts.length === 0) {
      return Response.json({ message: "כל המוצרים כבר מעודכנים!" });
    }

    const updates = [];

    for (const prod of missingProducts) {
      const prompt = `Find professional image URL (.jpg/.png) and YouTube embed URL for: "${prod.product_name}". 
      Return ONLY JSON: {"img": "...", "yt": "...", "desc": "תיאור בעברית"}`;
      
      const result = await model.generateContent(prompt);
      const response = JSON.parse(result.response.text());

      // 2. עדכון ב-Supabase
      await supabase.from('inventory').update({
        image_url: response.img,
        youtube_url: response.yt,
        description: response.desc
      }).eq('sku', prod.sku);
      
      updates.push(prod.product_name);
    }

    return Response.json({ success: true, updated: updates });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
