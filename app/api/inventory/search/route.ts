import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) return NextResponse.json([]);

  // שאילתה לטבלת inventory הקיימת שלך
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(5); // מחזיר את 5 התוצאות הכי רלוונטיות

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
