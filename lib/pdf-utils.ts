/**
 * פונקציה להיפוך טקסט עברי לצורך תצוגה תקינה ב-jsPDF
 * מטפלת בהיפוך אותיות תוך שמירה על כיוון מספרים
 */
export const fixHebrewForPDF = (text: string): string => {
  if (!text) return "";
  
  // פיצול לפי מילים, היפוך כל מילה עברית, וחיבור מחדש בסדר הפוך
  return text
    .split(" ")
    .map((word) => {
      // אם המילה מכילה אותיות בעברית - נהפוך אותה
      if (/[\u0590-\u05FF]/.test(word)) {
        return word.split("").reverse().join("");
      }
      return word;
    })
    .reverse()
    .join(" ");
};

/**
 * פונקציה להכנת נתוני טבלה ל-PDF עם תמיכה בעברית
 */
export const prepareTableRows = (items: any[]) => {
  return items.map((item) => [
    fixHebrewForPDF(item.container_size || "-"), // אריזה
    item.quantity.toString(),                     // כמות (מספרים לא הופכים)
    fixHebrewForPDF(item.sku || "-"),             // מק"ט
    fixHebrewForPDF(item.item_name),              // שם פריט
  ]);
};
