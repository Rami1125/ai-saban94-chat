import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ExternalLink } from "lucide-react";

interface ProductCardProps {
  product: {
    product_name: string;
    sku: string;
    stock_quantity: number;
    price: number;
    product_magic_link?: string;
    image_url?: string;
    description?: string;
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
    <Card className="w-full max-w-sm overflow-hidden border border-slate-200 shadow-md bg-card transition-all duration-300 hover:shadow-xl hover:border-blue-400 rounded-xl">
      {/* Product Image Container */}
      <CardHeader className="p-0 border-b border-slate-100">
        <div className="relative h-56 w-full bg-slate-50/80 flex items-center justify-center p-4">
          <img 
            src={displayImage} 
            alt={product.product_name}
            className="max-h-full max-w-full object-contain"
          />
          <Badge 
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="absolute top-3 right-3 shadow-sm font-medium"
          >
            {isOutOfStock ? "בדיקת מלאי טלפונית" : "זמין במלאי"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        {/* Product Name */}
        <h3 className="text-xl font-bold text-foreground mb-2 leading-tight text-balance">
          {product.product_name}
        </h3>
        
        {/* Price */}
        <div className="text-2xl font-bold text-primary mb-4">
          {product.price > 0 ? `₪${product.price.toLocaleString()}` : "צור קשר למחיר"}
        </div>

        {/* Technical Specifications Table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-50/80 py-2.5 px-3 text-xs font-semibold text-muted-foreground w-1/3 border-l border-slate-100">
                  {"מק\"ט"}
                </td>
                <td className="py-2.5 px-3 text-xs text-foreground italic">
                  {product.sku}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-50/80 py-2.5 px-3 text-xs font-semibold text-muted-foreground border-l border-slate-100">
                  תכונות
                </td>
                <td className="py-2.5 px-3 text-xs text-foreground italic leading-relaxed">
                  {product.features || "מפרט טכני מלא בדף המוצר"}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="bg-slate-50/80 py-2.5 px-3 text-xs font-semibold text-muted-foreground border-l border-slate-100">
                  זמן ייבוש
                </td>
                <td className="py-2.5 px-3 text-xs text-foreground italic">
                  {product.drying_time || "ראה מפרט מלא"}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50/80 py-2.5 px-3 text-xs font-semibold text-muted-foreground border-l border-slate-100">
                  שיטת יישום
                </td>
                <td className="py-2.5 px-3 text-xs text-foreground italic">
                  {product.application_method || "בהתאם להוראות היצרן"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-2.5">
        {/* Quick Buy Button */}
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 text-sm shadow-sm transition-all duration-200 hover:shadow-md"
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 items-center justify-center">
            <ShoppingCart className="size-5" />
            לרכישה מהירה
          </a>
        </Button>
        
        {/* Full Specification Button */}
        <Button 
          variant="ghost" 
          className="w-full text-xs text-muted-foreground font-medium hover:text-primary hover:bg-accent/50 h-9 transition-colors duration-200" 
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
            <ExternalLink className="size-3.5" />
            צפה במפרט המלא
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
