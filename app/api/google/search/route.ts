import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "image";

    const API_KEY = process.env.Search_API_KEY;
    const CX = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

    if (!API_KEY || !CX || !query) return NextResponse.json([]);

    const googleUrl = new URL("https://www.googleapis.com/customsearch/v1");
    googleUrl.searchParams.set("key", API_KEY);
    googleUrl.searchParams.set("cx", CX);
    googleUrl.searchParams.set("q", query);
    if (type === "image") googleUrl.searchParams.set("searchType", "image");

    const response = await fetch(googleUrl.toString(), { next: { revalidate: 3600 } });
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) return NextResponse.json([]);

    const results = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image?.thumbnailLink || item.pagemap?.cse_thumbnail?.[0]?.src || item.link
    }));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json([]); 
  }
}
