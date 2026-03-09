/**
 * פונקציה להיפוך ויזואלי של עברית עבור PDF
 */
export const fixHebrewForPDF = (text: string | number | null | undefined): string => {
  if (text === null || text === undefined) return "";
  const str = String(text);
  
  const isHebrew = (word: string) => /[\u0590-\u05FF]/.test(word);

  return str
    .split(" ")
    .map((word) => {
      if (isHebrew(word)) {
        return word.split("").reverse().join("");
      }
      return word;
    })
    .reverse()
    .join(" ");
};

/**
 * מכין את שורות הטבלה עם היפוך עברית
 */
export const prepareTableRows = (items: any[]) => {
  return items.map((item) => [
    fixHebrewForPDF(item.container_size || "-"),
    item.quantity.toString(),
    fixHebrewForPDF(item.sku || "-"),
    fixHebrewForPDF(item.item_name),
  ]);
};

/**
 * פונקציה להוספת פונט עברי (Heebo) ל-jsPDF
 * הערה: בייצור כדאי להשתמש במחרוזת Base64 אמיתית של הפונט.
 */
export const addHebrewFont = (doc: any) => {
  // כאן ניתן להוסיף פונט מותאם. כרגע נשתמש ב-Helvetica כברירת מחדל 
  // אך נגדיר יישור ימני מוחלט כדי למנוע ג'יבריש בדפדפנים תומכי Unicode.
  doc.setFont("helvetica", "normal");
};
