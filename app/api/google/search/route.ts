import { NextResponse } from "next/server";

/**
 * Saban OS - Google Assets Search API V34.0
 * ----------------------------------------
 * מחזיר תמיד מערך, גם במקרה של שגיאה, כדי למנוע קריסת פרונט-אנד.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "image";

    const API_KEY = process.env.Search_API_KEY;
    const CX = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

    if (!API_KEY || !CX) {
      console.error("Search API Key or CSE ID missing in Env");
      return NextResponse.json([]); // מחזיר מערך ריק במקום שגיאה
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

    if (!data.items) {
      return NextResponse.json([]);
    }

    const results = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image?.thumbnailLink || item.pagemap?.cse_thumbnail?.[0]?.src
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Google Proxy Error:", error.message);
    return NextResponse.json([]); // בטיחות מעל הכל
  }
}
