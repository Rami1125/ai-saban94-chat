import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, ExternalLink } from "lucide-react";

interface ProductCardProps {
  product: {
    product_name: string;
    sku: string;
    stock_quantity: number;
    product_magic_link?: string;
    image_url?: string; // וודא שיש עמודה כזו ב-Supabase
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isOutOfStock = product.stock_quantity <= 0;
  const productUrl = product.product_magic_link || `https://sidor.vercel.app/product-pages/index.html?id=${product.sku}`;
  
  // תמונת ברירת מחדל אם אין תמונה ב-DB
  const displayImage = product.image_url || "/api/placeholder/400/320";

  return (
    <Card className="w-full max-w-sm overflow-hidden border-2 hover:border-blue-500 transition-all shadow-md">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full bg-muted">
          <img 
            src={displayImage} 
            alt={product.product_name}
            className="h-full w-full object-cover"
          />
          <Badge 
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="absolute top-2 right-2 text-xs font-bold"
          >
            {isOutOfStock ? "חסר במלאי" : `במלאי: ${product.stock_quantity}`}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-bold leading-tight">
            {product.product_name}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Package size={14} />
          מק"ט: {product.sku}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center justify-center"
          asChild
        >
          <a href={productUrl} target="_blank" rel="noopener noreferrer">
            <ShoppingCart size={18} />
            לרכישה מהירה
          </a>
        </Button>
        
        <Button variant="outline" className="w-full text-xs py-1 h-8 border-dashed" asChild>
          <a href={productUrl} target="_blank">
            <ExternalLink size={12} className="ml-1" />
            צפה בדף מוצר מלא
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
