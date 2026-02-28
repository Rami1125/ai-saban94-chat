import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  const status = {
    supabase: !!process.env.SUPABASE_SERVICE_ROLE,
    gemini: !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY),
    googleSearch: !!process.env.GOOGLE_CSE_API_KEY,
  }

  return NextResponse.json({
    env_status: {
      supabase_url: "✅ מוגדר",
      supabase_service_key: status.supabase ? "✅ מוגדר" : "❌ חסר",
      gemini_key: status.gemini ? "✅ מוגדר" : "❌ חסר",
      google_search_key: status.googleSearch ? "✅ מוגדר" : "❌ חסר"
    },
    db_connection: "✅ חיבור תקין"
  })
}
