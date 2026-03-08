"use client";
// ... שאר ה-Imports זהים לקוד הקודם
export default function AdminDashboard() {
  // ... לוגיקת ה-Fetch זהה
  return (
    <div className="p-6 bg-slate-100 min-h-screen" dir="rtl">
      {/* ... כותרת */}
      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-r-8 border-r-blue-600">
             <CardContent className="p-4 flex justify-between items-center">
                <div>
                   <h3 className="font-bold text-lg">{order.customer_name}</h3>
                   <div className="flex items-center gap-3 mt-2">
                      <div 
                        className="w-10 h-10 rounded shadow-inner border" 
                        style={{ backgroundColor: order.hex_preview }} 
                      />
                      <div>
                         <p className="font-black text-blue-800">גוון: {order.color_code || 'ללא'}</p>
                         <p className="text-sm font-bold">אריזה: {order.container_size || 'לא נבחר'}</p>
                      </div>
                   </div>
                </div>
                {/* כפתורי עדכון מחיר וחיוב */}
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
