import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. שליפת מוצרים ללא תמונה (מגבלה של 5 לכל לחיצה כדי לא לחסום את המפתח)
    const { data: products, error: fetchError } = await supabase
      .from('inventory')
      .select('sku, product_name')
      .is('image_url', null)
      .limit(5);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return Response.json({ success: true, message: "הכל מעודכן אחי!" });
    }

    const updatedItems = [];

    for (const prod of products) {
      // 2. פנייה ל-Gemini לשליפת מדיה
      const prompt = `Find a direct product image URL (.jpg/.png) and a YouTube embed link for the construction product: "${prod.product_name}". 
      Return ONLY a JSON object: {"img": "URL", "yt": "URL", "desc": "תיאור קצר בעברית"}`;

      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text().replace(/```json|```/g, ""));

      // 3. עדכון ה-Database
      await supabase.from('inventory').update({
        image_url: data.img,
        youtube_url: data.yt,
        description: data.desc
      }).eq('sku', prod.sku);

      updatedItems.push(prod.product_name);
    }

    return Response.json({ success: true, updated: updatedItems });
  } catch (error: any) {
    console.error(error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
