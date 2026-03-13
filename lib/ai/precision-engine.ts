/**
 * Saban Precision Engine - מנוע הדיוק והבקרה של ח. סבן
 * כולל: בודק התנגשויות, המלשינון, ומעבד הדיוק הלוגיסטי
 */

interface SabanRule {
  id: string;
  instruction: string;
  category: 'logistics' | 'vip' | 'sales' | 'authority';
}

export class SabanSentinel {
  private rules: SabanRule[];

  constructor(rules: SabanRule[]) {
    this.rules = rules;
  }

  /**
   * 1. בודק התנגשויות (Conflict Checker)
   * סורק את ספר החוקים ומוודא שאין סתירות לוגיות
   */
  public validateRules() {
    const findings: string[] = [];
    const allInstructions = this.rules.map(r => r.instruction.toLowerCase()).join(" ");

    // בדיקת סתירות נהגים וסניפים
    if (allInstructions.includes("חכמת") && allInstructions.includes("התלמיד 6")) {
      findings.push("🔴 התנגשות: חכמת (מנוף) מוגבל לסניף החרש 10 בלבד. מצאתי הנחיה סותרת לסניף התלמיד.");
    }

    // בדיקת סתירות VIP
    if (allInstructions.includes("אורניל") && !allInstructions.includes("סטרומה 4")) {
      findings.push("🟡 חוסר דיוק: לקוח 'אורניל' מופיע ללא שיוך לכתובת הקבועה (סטרומה 4).");
    }

    // בדיקת סתירות מדיניות מחירים
    const hasHidePrice = allInstructions.includes("אל תציין מחיר") || allInstructions.includes("בדיקה טלפונית");
    const hasShowPrice = allInstructions.includes("הצג מחיר") || allInstructions.includes("מחירון");
    
    if (hasHidePrice && hasShowPrice) {
      findings.push("🔴 התנגשות קריטית: קיימת הנחיה להסתיר מחיר וגם להציג מחיר במקביל.");
    }

    return {
      isSafe: findings.length === 0,
      reports: findings
    };
  }

  /**
   * 2. המלשינון (The Snitch)
   * כלי שבודק את תשובת ה-AI לפני שהיא יוצאת לראמי/לקוח
   */
  public auditResponse(aiResponse: string, context: any) {
    const flags: string[] = [];

    // האם המוח שכח את חוק אלי מסיקה?
    if (aiResponse.toLowerCase().includes("סיקה") && !aiResponse.includes("אלי")) {
      flags.push("המוח שכח להציע את אלי מסיקה במוצר סיקה.");
    }

    // האם המוח ציין מחיר בניגוד לחוק?
    const priceRegex = /\d+\s*ש"ח|\d+\s*₪/;
    if (priceRegex.test(aiResponse) && aiResponse.includes("סיקה")) {
      flags.push("המוח חשף מחיר של מוצר סיקה - חריגת אבטחה!");
    }

    // וידוא כתובת VIP
    if (context.client === 'בר' && !aiResponse.includes("סטרומה 4")) {
      flags.push("המוח לא זיהה אוטומטית את סטרומה 4 עבור בר (אורניל).");
    }

    return flags;
  }

  /**
   * 3. מעבד הדיוק (Precision Processor)
   * "מנקה" ומדייק את ה-DNA לפני השליחה
   */
  public getOptimizedDNA() {
    return this.rules.map(r => {
      // הזרקת שכבת דיוק אוטומטית לכל חוק
      return `[RULE ${r.id}]: ${r.instruction} (דיוק: מחמיר)`;
    }).join("\n");
  }
}

/**
 * 4. רכיב כפתור שיתוף מוסתר (UI Component)
 * כפתור יוקרתי שמסתיר לינק ארוך
 */
export const WhatsAppVaultButton = ({ message, label = "שגר סידור לקבוצה" }: { message: string, label?: string }) => {
  const ramyPhone = "972508860896";
  
  const handleSecureShare = () => {
    // קידוד עמוק להסתרת תווים בעייתיים
    const safeMsg = encodeURIComponent(message);
    const vaultUrl = `https://wa.me/${ramyPhone}?text=${safeMsg}`;
    window.open(vaultUrl, '_blank');
  };

  return `
    <button onclick="${handleSecureShare}" class="saban-btn-vault">
      <span class="icon">🚀</span>
      <span class="text">${label}</span>
      <style>
        .saban-btn-vault {
          background: linear-gradient(135deg, #25D366 0%, #075E54 100%);
          color: white;
          padding: 18px 32px;
          border-radius: 20px;
          font-weight: 900;
          border: none;
          box-shadow: 0 10px 25px rgba(37,211,102,0.3);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .saban-btn-vault:hover { transform: scale(1.03); filter: brightness(1.1); }
      </style>
    </button>
  `;
};
