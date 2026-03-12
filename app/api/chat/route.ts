import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase"; // שימוש ב-Getter
import { getRTDB } from "@/lib/firebase";    // שימוש ב-Getter
import { ref, push, update } from "firebase/database";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // איתחול ה-Clients רק בזמן ריצה
    const supabase = getSupabase();
    const rtdb = getRTDB();
    
    const { messages, phone, user_id } = await req.json();
    const lastUserMsg = messages[messages.length - 1].content;

    // --- לוגיקת חיפוש ושליפת DNA (נשארת זהה, רק בתוך ה-POST) ---
    const { data: config } = await supabase.from('system_rules').select('instruction, agent_type, is_active');
    // ... שאר הלוגיקה שלך ...

    // --- ניהול ה-POOL (חשוב: בדיקת קיום מפתחות) ---
    const keys = (process.env.GOOGLE_AI_KEY_POOL || "").split(',').filter(k => k.trim().length > 10);
    
    if (keys.length === 0) throw new Error("API Keys missing in environment");

    // מודלים מעודכנים 2026
    const modelPool = [
      "gemini-3.1-flash-lite-preview", 
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview"
    ];

    let aiResponse = "";
    let success = false;

    // לוגיקת רוטציה
    for (let i = 0; i < keys.length; i++) {
      if (success) break;
      
      const genAI = new GoogleGenerativeAI(keys[i]);
      for (const modelName of modelPool) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `... DNA logic ...`
          });

          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
          });

          aiResponse = result.response.text();
          if (aiResponse) {
             success = true; 
             break;
          }
        } catch (e) {
          console.warn(`Key ${i} failed with ${modelName}`);
        }
      }
    }

    // --- עדכון Pipeline ומשלוח ---
    if (phone && aiResponse) {
      const cleanPhone = phone.replace('+', '').trim();
      await update(ref(rtdb, `saban94/pipeline/${cleanPhone}`), { 
        text: aiResponse, 
        timestamp: Date.now(),
        status: "pending"
      });
    }

    return NextResponse.json({ text: aiResponse });

  } catch (error: any) {
    console.error("Critical:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
