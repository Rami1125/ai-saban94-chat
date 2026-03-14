import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ShoppingCart, 
  CheckCircle2, 
  MapPin,
  RotateCcw,
  Package,
  Ruler
} from 'lucide-react';

/**
 * Saban OS V8 - רכיב כרטיס מוצר גנרי עם מחשבון לוגיסטי
 * @param {Object} product - אובייקט המוצר שנשלף מה-Supabase
 */
const ProductCard = ({ product }) => {
  // אם לא עבר מוצר, נשתמש בנתוני ברירת מחדל לבדיקה
  const p = product || {
    product_name: "מוצר לדוגמה",
    sku: "00000",
    image_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400",
    packaging_size: "שק / משטח",
    coverage_per_sqm: 0.15,
    features: ["איכות גבוהה", "עמיד לאורך זמן"],
    stock_quantity: 0
  };

  const [inputs, setInputs] = useState({
    length: "",
    height: "",
    manualArea: "",
    openings: "0",
    waste: "5"
  });

  const calculations = useMemo(() => {
    const l = parseFloat(inputs.length) || 0;
    const h = parseFloat(inputs.height) || 0;
    const mArea = parseFloat(inputs.manualArea) || 0;
    const ops = parseFloat(inputs.openings) || 0;
    const wst = parseFloat(inputs.waste) || 5;

    const baseArea = mArea > 0 ? mArea : l * h;
    const netArea = Math.max(0, baseArea - ops);
    const areaWithWaste = netArea * (1 + wst / 100);
    
    // חישוב יחידות לפי כושר כיסוי מהטבלה (ברירת מחדל 0.15 אם אין)
    const coverage = parseFloat(p.coverage_per_sqm) || 0.15;
    const unitsRequired = Math.ceil(areaWithWaste / coverage);

    return {
      netArea: netArea.toFixed(2),
      withWaste: areaWithWaste.toFixed(2),
      units: unitsRequired
    };
  }, [inputs, p]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const resetCalc = () => setInputs({ length: "", height: "", manualArea: "", openings: "0", waste: "5" });

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row" dir="rtl">
      
      {/* אזור מדיה */}
      <div className="lg:w-1/2 relative bg-slate-800 flex items-center justify-center min-h-[300px]">
        <img 
          src={p.image_url} 
          alt={p.product_name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-emerald-500/90 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-lg">
          {p.stock_quantity > 0 ? `במלאי: ${p.stock_quantity}` : 'בדוק זמינות'}
        </div>
      </div>

      {/* אזור תוכן */}
      <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col space-y-5">
        <header className="space-y-2">
          <h1 className="text-2xl font-black text-white">{p.product_name}</h1>
          <div className="bg-slate-800 p-2 rounded-xl text-[10px] font-mono inline-block text-slate-300">
            🔍 מק"ט: {p.sku} | ⚖️ אריזה: {p.packaging_size || 'N/A'}
          </div>
        </header>

        {/* מחשבון משולב */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="flex items-center gap-2 text-sm font-black text-emerald-400">
              <Calculator size={16} /> מחשבון כמויות לביצוע
            </h3>
            <button onClick={resetCalc} className="text-slate-500 hover:text-rose-400"><RotateCcw size={14} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">אורך קיר</label>
              <input id="length" type="number" value={inputs.length} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white" placeholder="מטר" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">גובה קיר</label>
              <input id="height" type="number" value={inputs.height} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white" placeholder="מטר" />
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-[10px] text-emerald-500 font-bold uppercase">כמות מומלצת</div>
            <div className="text-2xl font-black text-emerald-400">{calculations.units} יח'</div>
            <div className="text-[9px] text-slate-500 mt-1">כולל {inputs.waste}% פחת</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
            <ShoppingCart size={16} /> הוסף להזמנה
          </button>
          <button onClick={() => window.open('/branches', '_blank')} className="px-4 border border-slate-800 rounded-xl hover:bg-slate-800">
            <MapPin size={18} className="text-slate-400" />
          </button>
        </div>

        <footer className="text-[9px] text-slate-600 flex justify-between items-center border-t border-slate-800 pt-3">
          <span>* מחושב לפי {parseFloat(p.coverage_per_sqm) || 0.15} מ"ר ליחידה</span>
          <span className="font-black italic">SABAN OS V8</span>
        </footer>
      </div>
    </div>
  );
};

// ברירת המחדל לייצוא היא האפליקציה שמציגה את הכרטיס
export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
      <ProductCard />
    </div>
  );
}
