"use client";

import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import { supabase } from "@/lib/supabase"; // המאגר הקיים שלך ב-GitHub

// קונפיגורציית Firebase (לפי התמונה שסיפקת)
const firebaseConfig = {
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function SabanAIEngine() {
  const [status, setStatus] = useState("OFFLINE");
  const [lastMsg, setLastMsg] = useState("");

  // 1. פונקציה לשליפת תשובה מהידע המקצועי ב-Supabase
  const getProfessionalAnswer = async (userText: string) => {
    // חיפוש בטבלה שראינו קודם ב-GitHub
    const { data } = await supabase
      .from("saban_unified_knowledge")
      .select("ai_response")
      .ilike("question_trigger", `%${userText}%`)
      .single();

    return data?.ai_response || "מצטער, אני צריך לבדוק את המפרט הטכני של המוצר הזה. מיד חוזר אליך.";
  };

  // 2. מאזין להודעות ווטסאפ נכנסות מ-Firebase
  useEffect(() => {
    const inboundRef = ref(db, "saban94/inbound");
    
    setStatus("LISTENING");

    const unsubscribe = onValue(inboundRef, async (snapshot) => {
      const messages = snapshot.val();
      if (!messages) return;

      // רץ על כל ההודעות החדשות
      for (const id in messages) {
        const msg = messages[id];

        if (msg.status === "pending") {
          setLastMsg(msg.text);
          
          // א. צליל אישור (שבנינו קודם)
          if (window.playSuccessSound) window.playSuccessSound();

          // ב. קבלת החלטה מה-AI/Supabase
          const answer = await getProfessionalAnswer(msg.text);

          // ג. שליחת תשובה לנתיב send.json (עבור תוסף JONI)
          await set(ref(db, `saban94/send/${id}`), {
            phone: msg.from,
            message: answer,
            timestamp: Date.now()
          });

          // ד. סימון הודעה כטופלה כדי שלא תענה פעמיים
          await update(ref(db, `saban94/inbound/${id}`), { status: "processed" });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000] text-right">
      <div className="flex justify-between items-center mb-4">
        <span className={`px-2 py-1 text-[10px] font-black ${status === 'LISTENING' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {status}
        </span>
        <h2 className="font-black text-sm uppercase">Saban AI Core</h2>
      </div>
      
      <div className="bg-slate-100 p-3 border border-slate-300">
        <span className="text-[9px] font-bold text-slate-400 block mb-1 underline">LAST INCOMING:</span>
        <p className="text-xs font-bold text-slate-700">{lastMsg || "מחכה להודעה..."}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="h-10 bg-black text-white text-[10px] font-black uppercase shadow-[2px_2px_0px_#3b82f6]">
          Restart Engine
        </button>
        <button className="h-10 bg-white border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_#000]">
          View Logs
        </button>
      </div>
    </div>
  );
}
