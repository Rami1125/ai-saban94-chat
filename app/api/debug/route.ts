import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const check = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ מוגדר" : "❌ חסר",
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE ? "✅ מוגדר" : "❌ חסר (חובה!)",
    gemini_key: (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) ? "✅ מוגדר" : "❌ חסר",
    google_search_key: process.env.GOOGLE_CSE_API_KEY ? "✅ מוגדר" : "❌ חסר",
  }

  if (check.supabase_url === "✅ מוגדר" && check.supabase_service_key === "✅ מוגדר") {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE!
      )
      const { error } = await supabase.from('answers_cache').select('count').limit(1)
      
      return NextResponse.json({
        env_status: check,
        db_connection: error ? `⚠️ מחובר אבל טבלה חסרה: ${error.message}` : "✅ חיבור לטבלה תקין!"
      })
    } catch (e: any) {
      return NextResponse.json({ env_status: check, db_connection: `❌ קריסה בחיבור: ${e.message}` })
    }
  }

  return NextResponse.json({ env_status: check, db_connection: "❌ לא ניתן לבדוק ללא מפתחות" })
}
