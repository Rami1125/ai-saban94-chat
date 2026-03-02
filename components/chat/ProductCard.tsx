"use client";

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, CheckCircle } from 'lucide-react';

interface ProductProps {
  product: {
    product_name: string;
    sku: string;
    price: number;
    description?: string;
    image_url?: string;
  };
}

export const ProductCard = ({ product }: ProductProps) => {
  return (
    <Card className="my-4 overflow-hidden border-2 border-blue-500/10 shadow-xl transition-all hover:shadow-2xl dark:bg-slate-900 rounded-[24px]">
      <CardHeader className="pb-2 text-right" dir="rtl">
        <div className="flex justify-between items-center mb-1">
          <Badge variant="default" className="bg-blue-600 text-[10px] font-black italic">
            SABAN STOCK
          </Badge>
          <span className="text-slate-400 text-[10px] font-mono">SKU: {product.sku}</span>
        </div>
        <CardTitle className="text-xl font-black text-slate-900 dark:text-white leading-tight">
          {product.product_name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-right" dir="rtl">
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-4xl font-black text-blue-600">{product.price}</span>
          <span className="text-sm font-bold text-slate-500">₪ + מע"מ</span>
        </div>

        <div className="space-y-3 mb-2">
          <div className="flex items-center gap-2 text-green-500 text-sm font-bold">
            <CheckCircle size={16} />
            <span>זמין לאיסוף מיידי</span>
          </div>
          {product.description && (
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed italic line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 dark:bg-slate-800/50 p-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl shadow-lg shadow-blue-500/20 gap-2">
          <ShoppingCart size={20} />
          להוספה להזמנה
        </Button>
      </CardFooter>
    </Card>
  );
};
