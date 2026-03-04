// utils/chat-helpers.ts
export const buildConsultMessage = (product: any, type: string) => ({
  role: "user" as const,
  content: `אני מעוניין בייעוץ לגבי ${type} עבור ${product.product_name}.`,
  // metadata נוסף שיעבור לשרת
});
