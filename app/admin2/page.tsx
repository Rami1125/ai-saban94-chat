"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  Store,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // טעינת נתונים
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // עדכון "מוצר החודש" (Promoted Product)
  const togglePromoted = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_promoted: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("שגיאה בעדכון המבצע");
    } else {
      toast.success("סטטוס המבצע עודכן");
      fetchData();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.sku.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#FCF9F5] flex font-sans" dir="rtl">
      
      {/* Sidebar - עיצוב מרובע מגושם ויוקרתי */}
      <aside className="w-72 bg-white border-l border-slate-100 p-8 flex flex-col gap-8 hidden lg:flex">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">S</div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none">ניהול סבן</h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Admin Panel v3.0</p>
          </div>
        </div>

        <nav className="space-y-2">
          <NavItem icon={<LayoutDashboard size={20}/>} label="דאשבורד" active />
          <NavItem icon={<Package size={20}/>} label="ניהול מלאי" />
          <NavItem icon={<Store size={20}/>} label="סניפים" />
          <NavItem icon={<TrendingUp size={20}/>} label="דוחות מכירה" />
          <NavItem icon={<Settings size={20}/>} label="הגדרות מערכת" />
        </nav>

        <div className="mt-auto bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <p className="text-xs font-black text-blue-700 mb-2">סטטוס מערכת</p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            סנכרון Supabase תקין
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ניהול קטלוג ומבצעים</h1>
            <p className="text-slate-400 font-medium mt-1">שלוט במוצרים המוצגים בסניפי החרש והתלמיד</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 gap-2">
            <Plus size={20} /> הוסף מוצר חדש
          </Button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="סה"כ מוצרים" value={products.length} color="blue" />
          <StatCard label="מוצרים במבצע" value={products.filter(p => p.is_promoted).length} color="amber" />
          <StatCard label="חוסרים במלאי" value="12" color="red" />
        </div>

        {/* Product Table / Catalog Management */}
        <section className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
              <Input 
                placeholder="חיפוש לפי שם או מק"ט..." 
                className="rounded-2xl bg-slate-50 border-none h-12 pr-12 font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" onClick={fetchData} className="rounded-xl gap-2 text-slate-400">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> רענן נתונים
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-6">מוצר</th>
                  <th className="p-6">מק"ט</th>
                  <th className="p-6">מחיר</th>
                  <th className="p-6">מלאי</th>
                  <th className="p-6">מוצר החודש</th>
                  <th className="p-6">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">IMG</div>
                        <span className="font-black text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-xs text-slate-400 font-bold">{product.sku}</td>
                    <td className="p-6 font-black text-slate-900">₪{product.price}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock} יח'
                      </span>
                    </td>
                    <td className="p-6">
                      <button 
                        onClick={() => togglePromoted(product.id, product.is_promoted)}
                        className={`p-2 rounded-xl transition-all ${product.is_promoted ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`}
                      >
                        <Star size={20} fill={product.is_promoted ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={18}/></button>
                        <button className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// Components פנימיים לעיצוב נקי
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: any, color: string }) {
  const colors: any = {
    blue: "bg-blue-600",
    amber: "bg-amber-500",
    red: "bg-red-500"
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
      <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        <TrendingUp size={24} />
      </div>
    </div>
  );
}
