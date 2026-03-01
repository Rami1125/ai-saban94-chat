import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { productName, sku } = await req.json();
    
    // הגדרת המפתח
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // הפרומפט המדויק לשליפת URL
    const prompt = `Search for a high-quality, professional product image URL for the following construction item: 
    Name: "${productName}"
    SKU: "${sku}"
    
    Return ONLY a valid JSON object with a single key "image_url". 
    Make sure the URL is a direct link to a .jpg, .png or .webp file.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // ניקוי תגיות Markdown במידה ויש
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return Response.json({ success: true, image_url: data.image_url });

  } catch (error: any) {
    console.error("Image Fetch Error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
