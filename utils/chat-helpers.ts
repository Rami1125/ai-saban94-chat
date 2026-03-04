import { Product, ChatMessage } from "../types";

export const buildConsultMessage = (product: Product, consultationType: string): Partial<ChatMessage> => {
  return {
    content: `אני מעוניין בייעוץ בנושא ${consultationType} עבור המוצר: ${product.product_name} (מק"ט: ${product.sku})`,
    product: product,
    timestamp: Date.now(),
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(price);
};
