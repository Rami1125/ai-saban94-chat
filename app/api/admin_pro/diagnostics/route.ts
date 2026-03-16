import { NextResponse } from "next/server";

/**
 * Saban OS - Diagnostic Engine V2.0
 * --------------------------------
 * בודק תקינות מפתחות Gemini 3.1 וחיפוש גוגל.
 * מונע שגיאות 500 על ידי זיהוי מוקדם של מפתחות חסומים.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {
    gemini_keys: [],
    search_api: null,
  };

  // 1. בדיקת מפתחות AI (רוטציית מפתחות)
  const aiKeys = (process.env.GOOGLE_AI_KEY_POOL || "").split(",").map(k => k.trim()).filter(k => k.length > 5);
  
  for (const [index, key] of aiKeys.entries()) {
    try {
      // נסיון קריאה קטן למודל החדש ביותר
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
        }
      );
      
      const data = await response.json();
      results.gemini_keys.push({
        index,
        masked: `***${key.slice(-4)}`,
        status: response.ok ? 'valid' : 'invalid',
        code: response.status,
        error: data.error?.message || (response.ok ? null : "Unknown Error")
      });
    } catch (e: any) {
      results.gemini_keys.push({ index, status: 'error', error: e.message });
    }
  }

  // 2. בדיקת מפתח Google Search (מנוע המדיה)
  const searchKey = process.env.Search_API_KEY;
  const cx = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

  if (searchKey && cx) {
    try {
      const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${searchKey}&cx=${cx}&q=test&searchType=image&num=1`);
      const data = await res.json();
      results.search_api = {
        status: res.ok ? 'valid' : 'invalid',
        code: res.status,
        error: data.error?.message || null
      };
    } catch (e: any) {
      results.search_api = { status: 'error', error: e.message };
    }
  } else {
    results.search_api = { status: 'missing', error: "מפתחות חיפוש לא הוגדרו ב-ENV" };
  }

  return NextResponse.json(results);
}
