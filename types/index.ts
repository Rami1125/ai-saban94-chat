export interface Product {
  id: string;
  product_name: string;
  sku: string;
  price: number;
  image_url?: string;
  video_url?: string;
  drying_time?: string;
  coverage?: string;
  description?: string;
  supplier_name?: string;
}

export interface BusinessConfig {
  businessId: string;
  businessName: string;
  primaryColor: string;
  apiUrl: string;
  features: {
    enableMaterialCalculator: boolean;
    enableVideoSupport: boolean;
    enableOrderSystem: boolean;
  };
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  product?: Product;
  timestamp: number;
}
