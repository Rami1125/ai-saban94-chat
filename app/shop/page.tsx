"use client";
import { useState } from "react";
import { 
  ShoppingCart, Search, Barcode, Send, CreditCard, 
  MapPin, Star, Share2, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SabanDigitalStore() {
  const [cart, setCart] = useState<any[]>([]);
  const [view, setView] = useState('grid'); // grid | table

  const shareToWhatsApp = () => {
    const text = `הזמנה חדשה מח.סבן - לקוח: רמי\nפריטים:\n${cart.map(i => `- ${i.name}`).join('\n')}`;
    window.open(`https://wa.me/972500000000?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen bg-[#FCF9F5]" dir="rtl">
      {/* Navbar יוקרתי */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black italic text-slate-900">ח.סבן <span className="text-blue-600">1994</span></h1>
            <div className="hidden md:flex gap-6 font-bold text-sm text-slate-500">
              <a href="#" className="text-blue-600">חנות מוצרים</a>
              <a href="#">מבצעים</a>
              <a href="#">סניפים</a>
              <a href="#">אודות</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative bg-slate-100 rounded-full px-4 py-2 flex items-center gap-2">
              <Search size={18} className="text-slate-400" />
              <input placeholder={`חיפוש מוצר...`} className="bg-transparent border-none outline-none text-sm font-bold" />
            </div>
            <div className="relative cursor-pointer">
               <ShoppingCart size={24} />
               <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* קטלוג ומוצרים */}
        <div className="lg:col-span-2 space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900">{`קטלוג חומרי בניין`}</h2>
              <p className="text-slate-400 font-bold">{`המחירים הכי טובים מהיבואן לצרכן`}</p>
            </div>
            <div className="flex bg-white rounded-xl p-1 shadow-sm border">
               <Button variant="ghost" size="sm" onClick={() => setView('grid')} className={view === 'grid' ? 'bg-slate-100' : ''}>ריבוע</Button>
               <Button variant="ghost" size="sm" onClick={() => setView('table')} className={view === 'table' ? 'bg-slate-100' : ''}>טבלה</Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* דוגמה לכרטיס מוצר פרימיום */}
            <ProductCard name="סיקה פלקס 11FC" price="35" sku="SKU-9921" onAdd={() => setCart([...cart, {name: 'סיקה פלקס'}])} />
            <ProductCard name="דבק קרמיקה 109" price="42" sku="SKU-1022" onAdd={() => setCart([...cart, {name: 'דבק קרמיקה'}])} />
          </div>

          {/* Google Reviews Section */}
          <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <img src="/google-g.png" className="w-6" />
              <h3 className="font-black text-xl">{`מה הלקוחות אומרים עלינו`}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReviewCard name="ישראל ישראלי" text="שירות מעולה, מחירים הכי טובים באזור הוד השרון." stars={5} />
              <ReviewCard name="מוחמד מסארווה" text="מקצוענים אמיתיים, ה-AI עזר לי לבחור את הדבק הנכון." stars={5} />
            </div>
          </section>
        </div>

        {/* סל קנייה וצ'ק-אאוט */}
        <aside className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl sticky top-28">
            <h3 className="text-xl font-black mb-6">{`סיכום הזמנה`}</h3>
            <div className="space-y-4 mb-8">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="opacity-80 font-bold">{item.name}</span>
                  <span className="font-black">₪{item.price || 0}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 mb-8">
               <div className="flex justify-between items-center text-xl font-black">
                 <span>{`סה"כ`}</span>
                 <span className="text-blue-400">₪{cart.length * 35}</span>
               </div>
            </div>

            <Tabs defaultValue="card" className="w-full">
              <TabsList className="grid grid-cols-2 bg-white/10 rounded-xl mb-4">
                <TabsTrigger value="card" className="font-bold">אשראי</TabsTrigger>
                <TabsTrigger value="wa" className="font-bold text-green-400">WhatsApp</TabsTrigger>
              </TabsList>
              
              <TabsContent value="card" className="space-y-3">
                <Input placeholder="מספר כרטיס" className="bg-white/5 border-white/10 text-white" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="MM/YY" className="bg-white/5 border-white/10 text-white" />
                  <Input placeholder="CVV" className="bg-white/5 border-white/10 text-white" />
                </div>
                <Button className="w-full bg-blue-600 h-14 rounded-xl font-black mt-2">בצע תשלום</Button>
              </TabsContent>

              <TabsContent value="wa">
                <p className="text-[10px] opacity-60 mb-4 text-center">{`הרשימה תשלח ישירות למנהל המחסן בצירוף QR`}</p>
                <Button onClick={shareToWhatsApp} className="w-full bg-green-600 h-14 rounded-xl font-black gap-2">
                  <Share2 size={18} /> {`שלח ל-WhatsApp`}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ProductCard({ name, price, sku, onAdd }: any) {
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="w-full h-48 bg-slate-50 rounded-[2rem] mb-4 flex items-center justify-center font-black text-slate-300">תמונת מוצר</div>
      <h4 className="font-black text-lg text-slate-900">{name}</h4>
      <p className="text-xs font-bold text-slate-400 mb-4">{sku}</p>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-black text-blue-600">₪{price}</span>
        <Button onClick={onAdd} className="bg-slate-900 rounded-xl px-6 font-black group-hover:bg-blue-600 transition-colors">הוסף</Button>
      </div>
    </div>
  );
}

function ReviewCard({ name, text, stars }: any) {
  return (
    <div className="bg-slate-50 p-6 rounded-3xl">
      <div className="flex gap-1 text-amber-400 mb-2">
        {[...Array(stars)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="text-xs font-bold text-slate-700 mb-3 italic">"{text}"</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{name}</p>
    </div>
  );
}
