import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, ExternalLink, Droplets, Clock, PlayCircle } from "lucide-react";

interface ProductCardProps {
  product: {
    product_name: string;
    sku: string;
    stock_quantity: number;
    price: number;
    unit_type?: string;
    product_magic_link?: string;
    image_url?: string;
    youtube_url?: string;
    description?: string;
    drying_time?: string;      // שדה מה-Inventory
    application_method?: string; // שדה מה-Inventory
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const productUrl = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
  const displayImage = product.image_url || "/api/placeholder/400/320";

  return (
    <Card className="w-full max-w-sm overflow-hidden border-2 hover:border-blue-500 transition-all shadow-lg bg-white">
      {/* תמונה ותג מלאי */}
      <CardHeader className="p-0 relative">
        <div className="relative h-48 w-full bg-muted">
          <img 
            src={displayImage} 
            alt={product.product_name}
            className="h-full w-full object-cover"
          />
          <Badge 
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="absolute top-2 right-2 text-xs font-bold shadow-sm"
          >
            {isOutOfStock ? "בדיקת מלאי טלפונית" : `זמין במלאי`}
          </Badge>
          
          {/* כפתור וידאו צף במידה וקיים */}
          {product.youtube_url && (
            <a href={product.youtube_url} target="_blank" rel="noopener noreferrer" 
               className="absolute bottom-2 right-2 bg-red-600 text-white p-1 rounded-full hover:scale-110 transition-transform">
              <PlayCircle size={24} />
            </a>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {/* כותרת ומחיר */}
        <div>
          <CardTitle className="text-lg font-bold leading-tight mb-1">
            {product.product_name}
          </CardTitle>
          <div className="flex items-baseline gap-1 text-blue-700 font-black text-xl">
            <span>₪{product.price}</span>
            {product.unit_type && <span className="text-xs font-normal text-muted-foreground">/ {product.unit_type}</span>}
          </div>
        </div>

        {/* נתונים טכניים מה-Inventory */}
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100">
          {product.drying_time && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Clock size={14} className="text-blue-500" />
              <span>ייבוש: {product.drying_time}</span>
            </div>
          )}
          {product.application_method && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Droplets size={14} className="text-blue-500" />
              <span>יישום: {product.application_method}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Package size={12} />
          מק"ט: {product.sku}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 shadow-md transition-all active:scale-95"
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center justify-center">
            <ShoppingCart size={18} />
            לרכישה מהירה
          </a>
        </Button>
        
        <Button variant="ghost" className="w-full text-xs text-blue-600 h-8" asChild>
          <a href={productUrl} target="_blank">
            <ExternalLink size={12} className="ml-1" />
            מפרט טכני מלא
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
