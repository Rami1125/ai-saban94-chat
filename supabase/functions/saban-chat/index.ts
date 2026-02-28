import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    
    // שליפת מפתחות מה-Secrets של המערכת
    const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // חיפוש חכם - שימוש ב-product_name כפי שמופיע ב-CSV שלך
    const { data: products, error: dbError } = await supabase
      .from("inventory")
      .select("*")
      .or(`product_name.ilike.%${message}%,sku.ilike.%${message}%`)
      .limit(3);

    if (dbError) throw dbError;

    // בניית הקשר (Context) עבור ג'מיני
    const productContext = products && products.length > 0 
      ? `מצאתי את המוצרים הבאים במלאי: ${products.map(p => 
          `${p.product_name} (מק"ט: ${p.sku}, מחיר: ₪${p.price || 'צרו קשר'}, צריכה: ${p.coverage_per_sqm || 'לפי דרישה'})`
        ).join(" | ")}`
      : "לא נמצאו מוצרים תואמים במלאי כרגע.";

    // קריאה לג'מיני (Gemini 1.5 Flash)
    const geminiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `אתה עוזר חכם ומקצועי של "סבן חומרי בניין". השב בעברית בלבד.
            השתמש במידע הבא מהמלאי כדי לענות: ${productContext}.
            אם נמצא מוצר, ציין את יתרונותיו (features). השאלה: ${message}`
          }]
        }]
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply, products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
