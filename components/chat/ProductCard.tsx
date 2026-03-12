import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, ExternalLink, Info } from "lucide-react";

interface ProductCardProps {
  product: {
    product_name: string;
    sku: string;
    stock_quantity: number;
    price: number;
    product_magic_link?: string;
    image_url?: string;
    description?: string;
    features?: string;      // תכונות מה-DB
    drying_time?: string;   // זמן ייבוש מה-DB
    application_method?: string; // שיטת יישום מה-DB
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const productUrl = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
  const displayImage = product.image_url || "/api/placeholder/400/320";

  return (
    <Card className="w-full max-w-sm overflow-hidden border-2 shadow-lg bg-white transition-all hover:shadow-xl">
      {/* תמונת מוצר בקונטיינר (Canvas-style) */}
      <CardHeader className="p-0 border-b">
        <div className="relative h-56 w-full bg-slate-50 flex items-center justify-center p-2">
          <img 
            src={displayImage} 
            alt={product.product_name}
            className="max-h-full max-w-full object-contain mix-blend-multiply"
          />
          <Badge 
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="absolute top-3 right-3 shadow-md"
          >
            {isOutOfStock ? "בדיקת מלאי טלפונית" : "זמין במלאי"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight">
          {product.product_name}
        </h3>

        {/* טבלת נתונים מעוצבת בסעיפים */}
        <div className="rounded-lg border border-slate-200 overflow-hidden mb-4">
          <div className="flex border-b border-slate-100 italic">
            <div className="w-1/3 bg-slate-50 p-2 text-xs font-bold text-slate-500 border-l border-slate-100">מק"ט</div>
            <div className="w-2/3 p-2 text-xs text-slate-700 font-medium">{product.sku}</div>
          </div>
          
          <div className="flex border-b border-slate-100 italic">
            <div className="w-1/3 bg-slate-50 p-2 text-xs font-bold text-slate-500 border-l border-slate-100">תכונות</div>
            <div className="w-2/3 p-2 text-xs text-slate-700 leading-relaxed">
              {product.features || "מפרט טכני מלא בדף המוצר"}
            </div>
          </div>

          <div className="flex border-b border-slate-100 italic">
            <div className="w-1/3 bg-slate-50 p-2 text-xs font-bold text-slate-500 border-l border-slate-100">שיטת יישום</div>
            <div className="w-2/3 p-2 text-xs text-slate-700">
              {product.application_method || "בהתאם להוראות היצרן"}
            </div>
          </div>

          <div className="flex italic">
            <div className="w-1/3 bg-slate-50 p-2 text-xs font-bold text-slate-500 border-l border-slate-100">זמן ייבוש</div>
            <div className="w-2/3 p-2 text-xs text-slate-700">
              {product.drying_time || "ראה מפרט מלא"}
            </div>
          </div>
        </div>

        {/* מחיר בולט */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="text-sm font-medium text-slate-500 italic">מחיר ליחידה:</div>
          <div className="text-2xl font-black text-blue-700">
            {product.price > 0 ? `₪${product.price}` : "צור קשר"}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-md shadow-md"
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center justify-center">
            <ShoppingCart size={20} />
            לרכישה מהירה
          </a>
        </Button>
        
        <Button variant="ghost" className="w-full text-xs text-slate-400 font-medium hover:text-blue-600" asChild>
          <a href={productUrl} target="_blank" className="flex items-center justify-center gap-1">
            <ExternalLink size={12} />
            צפה במפרט המלא
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
