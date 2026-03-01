import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return Response.json({ success: false, error: "Missing API Key" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    // שימוש בשם המודל היציב ביותר למניעת שגיאות 404
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // שליפת 5 מוצרים שאין להם תמונה (NULL או ריק)
    const { data: products, error: fetchError } = await supabase
      .from('inventory')
      .select('sku, product_name')
      .or('image_url.is.null,image_url.eq.""')
      .limit(5);

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return Response.json({ success: true, message: "הכל מעודכן!" });
    }

    const updatedItems = [];

    for (const prod of products) {
      try {
        const prompt = `Search for a direct product image URL and a YouTube tutorial for: "${prod.product_name}". 
        Return ONLY a JSON object: {"img": "URL", "yt": "URL", "desc": "תיאור מקצועי בעברית"}`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        // ניקוי תגיות Markdown אם קיימות
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        await supabase.from('inventory').update({
          image_url: data.img,
          youtube_url: data.yt,
          description: data.desc
        }).eq('sku', prod.sku);

        updatedItems.push(prod.product_name);
      } catch (err) {
        console.error(`Error with SKU ${prod.sku}:`, err);
        continue;
      }
    }

    return Response.json({ success: true, updated: updatedItems });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
