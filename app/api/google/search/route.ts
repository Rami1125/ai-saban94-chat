import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const API_KEY = process.env.Search_API_KEY;
    const CX = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

    if (!API_KEY || !CX) throw new Error("Search API Key or CSE ID missing");

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query || "")}&searchType=image`);
    const data = await response.json();

    const results = data.items?.map((item: any) => ({
      title: item.title,
      link: item.link
    })) || [];

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
