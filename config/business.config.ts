// config/business.config.ts
import { BusinessConfig } from "../types";

/**
 * פונקציית עזר לחילוץ משתני סביבה עם הגנה מפני קריסות בזמן Build.
 * @param key שם משתנה הסביבה
 * @param defaultValue ערך ברירת מחדל למקרה שהמשתנה חסר
 */
const getEnv = (key: string, defaultValue: string): string => {
  // בדיקה של המשתנה עם ובלי הקידומת NEXT_PUBLIC
  const value = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];

  if (!value) {
    // אם אנחנו בזמן ריצה בדפדפן (Client-side) וחסר משתנה - נדפיס אזהרה
    if (typeof window !== "undefined") {
      console.warn(`[Config Warning]: Environment variable ${key} is missing. Using default: ${defaultValue}`);
    }
    
    // בזמן Build ב-Vercel, אנחנו חייבים להחזיר ערך כדי שלא תהיה שגיאת Prerender
    return defaultValue;
  }

  return value;
};

/**
 * הגדרות העסק המרכזיות - White Label Configuration
 * כל רכיבי המערכת שואבים את המידע מכאן דרך ה-BusinessConfigContext
 */
export const businessConfig: BusinessConfig = {
  // מזהה ייחודי לעסק (למשל: saban)
  businessId: getEnv("BUSINESS_ID", "saban"),

  // שם העסק שיוצג בכותרות ובצ'אט
  businessName: getEnv("BUSINESS_NAME", "ח. סבן חומרי בניין"),

  // צבע המיתוג המרכזי (Hex)
  primaryColor: getEnv("PRIMARY_COLOR", "#0B2C63"),

  // כתובת ה-API של הצ'אט
  apiUrl: getEnv("API_URL", "/api/chat"),

  // הגדרות פיצ'רים (Feature Flags)
  features: {
    // האם להציג כפתורי חישוב כמויות בכרטיס מוצר
    enableMaterialCalculator: getEnv("ENABLE_CALC", "true") === "true",

    // האם לאפשר תמיכה בוידאו בתוך כרטיסי מוצר
    enableVideoSupport: getEnv("ENABLE_VIDEO", "true") === "true",

    // האם לאפשר מערכת הזמנות ישירה מהצ'אט
    enableOrderSystem: getEnv("ENABLE_ORDER", "false") === "true",
  },
};

/**
 * ולידציה קצרה שרצה רק בשרת בזמן אמת (לא ב-Build)
 */
if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
  if (!process.env.BUSINESS_ID && !process.env.NEXT_PUBLIC_BUSINESS_ID) {
    console.error("❌ CRITICAL ERROR: BUSINESS_ID is not defined in Production environment!");
  }
}
