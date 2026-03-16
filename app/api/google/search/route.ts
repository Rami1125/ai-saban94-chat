import { NextResponse } from "next/server";

/**
 * Saban OS - Google Assets Search API V32.0
 * ----------------------------------------
 * מחבר את הקטלוג לחיפוש תמונות וסרטונים של Google Custom Search.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "image";

    const API_KEY = process.env.Search_API_KEY;
    const CX = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

    if (!API_KEY || !CX) {
      throw new Error("Missing Google Search Configuration (API Key or CSE ID)");
    }

    const googleUrl = new URL("https://www.googleapis.com/customsearch/v1");
    googleUrl.searchParams.set("key", API_KEY);
    googleUrl.searchParams.set("cx", CX);
    googleUrl.searchParams.set("q", query || "");

    if (type === "image") {
      googleUrl.searchParams.set("searchType", "image");
    }

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    const results = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image?.thumbnailLink || item.pagemap?.cse_thumbnail?.[0]?.src,
      context: item.image?.contextLink || item.link
    })) || [];

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Google Search Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
