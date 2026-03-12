// app/api/dispatch/itooran-sync/route.ts
import { NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();
    const supabase = getSupabase();
    const today = new Date().toISOString().split('T')[0];

    for (const row of rows) {
      // ניקוי שם נהג מדוח איתורן (למשל: "חכמת גאבר")
      const rawDriver = row["שם נהג"] || "";
      const cleanDriverName = rawDriver.replace("נהג קבוע:", "").replace(/\n/g, " ").trim();
      const alertName = row["שם התראה"] || "";
      const timestamp = row["זמן הודעה"];
      const address = row["כתובת"];

      if (!cleanDriverName || !alertName) continue;

      // חיפוש הזמנה פעילה של הנהג מהסידור של היום
      const { data: order } = await supabase
        .from('dispatch_orders')
        .select('*')
        .eq('scheduled_date', today)
        .ilike('driver_name', `%${cleanDriverName}%`)
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (order) {
        if (alertName.includes("פתיחת מנוף")) {
          await supabase.from('dispatch_orders').update({
            status: 'unloading',
            actual_pto_start: timestamp,
            ai_recommendations: `🏗️ פריקה החלה ב-${address}`
          }).eq('id', order.id);
        } 
        else if (alertName.includes("סגירת מנוף") && order.actual_pto_start) {
          const startTime = new Date(order.actual_pto_start).getTime();
          const endTime = new Date(timestamp).getTime();
          const durationMins = Math.round((endTime - startTime) / 60000);

          await supabase.from('dispatch_orders').update({
            status: 'completed',
            actual_pto_end: timestamp,
            actual_duration_mins: durationMins,
            ai_recommendations: `✅ פריקה הושלמה. זמן בפועל: ${durationMins} דקות.`
          }).eq('id', order.id);
          
          // כאן המערכת לומדת: מעדכנת את היסטוריית הכתובת בטבלה נפרדת אם תרצה
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
