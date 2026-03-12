import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ExternalLink, Package, ShieldCheck, Zap } from "lucide-react";

interface ProductCardProps {
  product: {
    product_name: string;
    sku: string;
    stock_quantity: number;
    price: number;
    product_magic_link?: string;
    image_url?: string;
    features?: string;
    drying_time?: string;
    application_method?: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const productUrl = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
  const displayImage = product.image_url || "/api/placeholder/400/320";

  return (
    <Card className="group w-full max-w-sm overflow-hidden border-2 border-slate-100 bg-white shadow-md transition-all duration-300 hover:border-blue-400 hover:shadow-xl">
      {/* תצוגת תמונה נקייה - Canvas Style */}
      <CardHeader className="p-0 border-b border-slate-50">
        <div className="relative h-60 w-full bg-[#f9fafb] flex items-center justify-center p-6">
          <img 
            src={displayImage} 
            alt={product.product_name}
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
          <Badge 
            variant={isOutOfStock ? "destructive" : "outline"}
            className={`absolute top-4 right-4 font-bold ${!isOutOfStock ? 'bg-white/80 backdrop-blur-sm text-green-600 border-green-200' : ''}`}
          >
            {isOutOfStock ? "בדיקת מלאי" : "זמין במלאי"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 text-balance">
            {product.product_name}
          </h3>
          <div className="flex items-center gap-2 text-2xl font-black text-blue-600">
            <span>{product.price > 0 ? `₪${product.price.toLocaleString()}` : "הצעת מחיר"}</span>
          </div>
        </div>

        {/* טבלת מפרט טכני פרימיום */}
        <div className="rounded-xl border border-slate-100 overflow-hidden text-sm mb-4 bg-slate-50/50">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-100/50 px-3 py-2 font-semibold text-slate-500 w-1/3">מק"ט</td>
                <td className="px-3 py-2 text-slate-700 italic font-medium tracking-wide">{product.sku}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-100/50 px-3 py-2 font-semibold text-slate-500">תכונות</td>
                <td className="px-3 py-2 text-slate-700 italic">{product.features || "מפרט תקני"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-100/50 px-3 py-2 font-semibold text-slate-500">יישום</td>
                <td className="px-3 py-2 text-slate-700 italic">{product.application_method || "לפי הוראות יצרן"}</td>
              </tr>
              <tr>
                <td className="bg-slate-100/50 px-3 py-2 font-semibold text-slate-500">ייבוש</td>
                <td className="px-3 py-2 text-slate-700 italic font-semibold">{product.drying_time || "מיידי"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-3">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-inner transition-transform active:scale-95"
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            <ShoppingCart size={18} />
            לרכישה מהירה
          </a>
        </Button>
        
        <Button variant="ghost" className="w-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" asChild>
          <a href={productUrl} target="_blank" className="flex items-center justify-center gap-1.5 text-xs font-medium">
            <ExternalLink size={14} />
            למפרט הטכני המלא של המוצר
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
