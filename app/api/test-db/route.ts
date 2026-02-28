import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
    hasGeminiKey: !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY),
  };

  // 1. בדיקת קיום משתנים (בלי לחשוף את המפתחות עצמם)
  if (!config.url || !config.hasServiceRole) {
    return NextResponse.json({
      status: "❌ Error",
      message: "Missing Environment Variables in Vercel",
      config: config
    }, { status: 500 });
  }

  try {
    const supabase = createClient(config.url, process.env.SUPABASE_SERVICE_ROLE!);
    
    // 2. ניסיון לבצע שאילתה פשוטה מאוד
    const { data, error } = await supabase.from('answers_cache').select('count').limit(1);

    if (error) {
      return NextResponse.json({
        status: "⚠️ Supabase Connected, but Table Error",
        error: error.message,
        hint: "Check if 'answers_cache' table exists in your Supabase Dashboard",
        config
      }, { status: 400 });
    }

    return NextResponse.json({
      status: "✅ Success!",
      message: "Vercel can talk to Supabase perfectly.",
      config
    });

  } catch (err: any) {
    return NextResponse.json({
      status: "❌ Crash",
      message: err.message,
      config
    }, { status: 500 });
  }
}
