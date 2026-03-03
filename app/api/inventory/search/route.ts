import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json([]);

  // חיפוש חלקי ב-Supabase לפי שם או מק"ט
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .or(`product_name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(5); // מחזירים רק את ה-5 הכי רלוונטיים כדי לא להעמיס

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
