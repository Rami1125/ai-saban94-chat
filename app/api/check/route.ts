import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  const status = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ מוגדר" : "❌ חסר",
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE ? "✅ מוגדר" : "❌ חסר (חובה!)",
    gemini_key: (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) ? "✅ מוגדר" : "❌ חסר",
    google_search_key: process.env.GOOGLE_CSE_API_KEY ? "✅ מוגדר" : "❌ חסר",
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    )
    
    // ניסיון משיכה פשוט מהטבלה שלך
    const { error } = await supabase.from('answers_cache').select('count').limit(1)
    
    return NextResponse.json({
      env: status,
      database: error ? `⚠️ שגיאת טבלה: ${error.message}` : "✅ מחובר ל-Supabase בהצלחה!"
    })
  } catch (e: any) {
    return NextResponse.json({ env: status, error: e.message }, { status: 500 })
  }
}
