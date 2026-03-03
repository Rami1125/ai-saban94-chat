// lib/key-manager.ts

export function getGeminiKey() {
  const keyPool = process.env.GOOGLE_AI_KEY_POOL;
  
  if (!keyPool) {
    // Fallback למפתח הישן אם שכחת לעדכן
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
  }

  const keys = keyPool.split(",").map(k => k.trim()).filter(k => k.length > 0);
  
  if (keys.length === 0) return "";

  // בחירה רנדומלית כדי לחלק את העומס בין המפתחות (Load Balancing)
  const randomIndex = Math.floor(Math.random() * keys.length);
  
  console.log(`[מלשינון] משתמש במפתח מספר ${randomIndex + 1} מתוך ${keys.length}`);
  return keys[randomIndex];
}
