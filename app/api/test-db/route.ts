import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// שימוש במפתחות הניהול (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. בדיקת קריאה - האם אנחנו בכלל מחוברים?
    const { data: readData, error: readError } = await supabaseAdmin
      .from('saban_master_dispatch')
      .select('id')
      .limit(1);

    if (readError) {
      return NextResponse.json({ 
        status: "Error", 
        message: "נכשל בקריאה מהטבלה. בדוק URL ומפתחות.",
        error: readError 
      }, { status: 500 });
    }

    // 2. בדיקת כתיבה (הזרקת ניסיון) - האם ה-Service Role עוקף RLS?
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('saban_master_dispatch')
      .insert([{
        customer_name: "בדיקת מערכת סבן",
        status: "בדיקה",
        order_id_comax: "TEST_AUTH_LOG",
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: "00:00"
      }])
      .select();

    if (insertError) {
      return NextResponse.json({ 
        status: "Permission Denied", 
        message: "קריאה הצליחה אך כתיבה נכשלה. כנראה בעיית הרשאות ב-Service Role.",
        error: insertError 
      }, { status: 403 });
    }

    // 3. מחיקת שורת הבדיקה כדי להישאר נקיים
    if (insertData?.[0]?.id) {
      await supabaseAdmin.from('saban_master_dispatch').delete().eq('id', insertData[0].id);
    }

    return NextResponse.json({ 
      status: "Success", 
      message: "המערכת חמושה ומוכנה! ל-Service Role יש הרשאות כתיבה מלאות.",
      data: insertData 
    });

  } catch (err: any) {
    return NextResponse.json({ status: "Crash", error: err.message }, { status: 500 });
  }
}
