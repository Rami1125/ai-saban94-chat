"use client";

import { supabase } from "@/lib/supabase";

// הגדרת מצבי הזיכרון של הבוט
type BotState = "IDLE" | "AWAITING_QUANTITY" | "AWAITING_ADDRESS" | "PRODUCT_INFO";

export const StudioBotLogic = {
  // פונקציית הליבה: קבלת קלט והחזרת תגובה ממאגר הנתונים
  processMessage: async (userInput: string, currentState: BotState, context: any) => {
    const input = userInput.trim().toLowerCase();

    // 1. בדיקה בטבלת שאלות ותשובות (ai_knowledge_base)
    const { data: kbAnswer } = await supabase
      .from('ai_knowledge_base')
      .select('answer')
      .ilike('question', `%${input}%`)
      .maybeSingle();

    if (kbAnswer) {
      return { 
        text: kbAnswer.answer, 
        nextState: "IDLE" as BotState 
      };
    }

    // 2. בדיקה בטבלת המלאי (inventory) - שליפת מוצר
    const { data: product } = await supabase
      .from('inventory')
      .select('*')
      .ilike('product_name', `%${input}%`)
      .maybeSingle();

    if (product) {
      return {
        text: `מצאתי את ${product.product_name} במלאי. המחיר הוא ₪${product.price}. כמה יחידות תרצה להזמין?`,
        product: product, // שליחת אובייקט המוצר להצגת ProductCard
        nextState: "AWAITING_QUANTITY" as BotState,
        context: { lastProductId: product.id }
      };
    }

    // 3. ניהול זיכרון - המשך דיאלוג לפי מצב קודם
    if (currentState === "AWAITING_QUANTITY" && !isNaN(Number(input))) {
      return {
        text: `רשמתי ${input} יחידות. לאיזו כתובת בתייבה או בסביבה לשלוח את ההזמנה?`,
        nextState: "AWAITING_ADDRESS" as BotState,
        context: { ...context, quantity: input }
      };
    }

    if (currentState === "AWAITING_ADDRESS") {
      return {
        text: `תודה. ההזמנה לכתובת "${userInput}" נקלטה במערכת. נציג מח. סבן יחזור אליך לאישור סופי.`,
        nextState: "IDLE" as BotState,
        context: {}
      };
    }

    // 4. מענה ברירת מחדל (Fallback) מתוך המאגר
    return {
      text: "מצטער, לא מצאתי מענה מדויק במאגר. האם תרצה לדבר עם נציג אנושי או לחפש מוצר אחר?",
      nextState: "IDLE" as BotState
    };
  }
};
