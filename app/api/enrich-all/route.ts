import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return Response.json({ success: false, error: "Missing API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // שימוש במודל היציב ביותר למניעת שגיאות 404
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. שליפת 5 מוצרים ללא תמונה
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
      try {
        const prompt = `Find a direct product image URL (.jpg or .png) and a YouTube tutorial link for the construction product: "${prod.product_name}". 
        Return ONLY a clean JSON object without markdown tags: 
        {"img": "URL", "yt": "URL", "desc": "תיאור קצר ומקצועי בעברית"}`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        
        // ניקוי תגיות ```json אם ה-AI הוסיף אותן בטעות
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        // 2. עדכון ה-Database
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            image_url: data.img,
            youtube_url: data.yt,
            description: data.desc
          })
          .eq('sku', prod.sku);

        if (!updateError) {
          updatedItems.push(prod.product_name);
        }
      } catch (itemError) {
        console.error(`Error updating product ${prod.sku}:`, itemError);
        continue; // מדלג למוצר הבא במקרה של שגיאה בודדת
      }
    }

    return Response.json({ 
      success: true, 
      updatedCount: updatedItems.length,
      updatedList: updatedItems 
    });

  } catch (error: any) {
    console.error("Critical Agent Error:", error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: "Check API model availability or Supabase connection"
    }, { status: 500 });
  }
}
