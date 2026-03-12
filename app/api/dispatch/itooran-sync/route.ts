import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { rows } = await req.json(); // מערך שורות מה-CSV של איתורן
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    for (const row of rows) {
      // ניקוי שם הנהג (מסיר "נהג קבוע:" ורווחים)
      const cleanDriverName = row["שם נהג"]?.replace("נהג קבוע:", "").trim();
      const alertName = row["שם התראה"];
      const timestamp = row["זמן הודעה"];
      const address = row["כתובת"];

      if (!cleanDriverName || !alertName) continue;

      // חיפוש ההזמנה הפתוחה של הנהג בסידור להיום
      const { data: order } = await supabase
        .from('dispatch_orders')
        .select('*')
        .eq('scheduled_date', today)
        .ilike('driver_name', `%${cleanDriverName}%`)
        .is('actual_pto_end', null) // מחפש הזמנה שעדיין לא הסתיימה
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (order) {
        if (alertName.includes("פתיחת מנוף")) {
          // עדכון סטטוס ל-"בפריקה" ורישום זמן התחלה
          await supabase.from('dispatch_orders').update({
            status: 'unloading',
            actual_pto_start: timestamp,
            ai_recommendations: `החל פריקה ב-${address}`
          }).eq('id', order.id);
        } 
        
        else if (alertName.includes("סגירת מנוף")) {
          // חישוב זמן פריקה וסגירת הזמנה
          const startTime = new Date(order.actual_pto_start).getTime();
          const endTime = new Date(timestamp).getTime();
          const durationMins = Math.round((endTime - startTime) / 60000);

          await supabase.from('dispatch_orders').update({
            status: 'completed',
            actual_pto_end: timestamp,
            actual_duration_mins: durationMins,
            ai_recommendations: `פריקה הושלמה תוך ${durationMins} דקות.`
          }).eq('id', order.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
