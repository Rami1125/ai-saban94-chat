"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Scanner({ onScan }: { onScan: (code: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const startScanner = async () => {
    setError(null);
    await stopScanner();

    const scanner = new Html5Qrcode("reader");
    qrCodeRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    try {
      // ניסיון הפעלה ישיר עם הגדרה למצלמה אחורית
      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          // צליל ביפ פשוט
          const audio = new AudioContext();
          const osc = audio.createOscillator();
          osc.connect(audio.destination);
          osc.start();
          osc.stop(audio.currentTime + 0.1);
        },
        () => {} // שגיאות סריקה שקטות
      );
      setIsStarted(true);
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setError("לא ניתן לגשת למצלמה. וודא שהרשאות מאושרות ושהמצלמה לא בשימוש.");
    }
  };

  useEffect(() => {
    // השהיה קלה כדי לוודא שה-DOM מוכן לחלוטין
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] border-4 border-slate-900 bg-black aspect-square shadow-2xl">
      
      {/* אלמנט הוידאו - נקי ללא עיצוב פנימי של הספרייה */}
      <div id="reader" className="w-full h-full object-cover"></div>

      {/* הודעת שגיאה */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <p className="text-white font-bold text-sm mb-6">{error}</p>
          <Button onClick={startScanner} className="bg-blue-600 rounded-2xl font-black">
            נסה שוב
          </Button>
        </div>
      )}

      {/* Overlay טעינה */}
      {!isStarted && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white">
          <Camera className="animate-pulse text-blue-500 mb-2" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">מתחבר למצלמה...</p>
        </div>
      )}

      {/* כפתור רענון מהיר */}
      {isStarted && (
        <button 
          onClick={startScanner}
          className="absolute bottom-4 left-4 z-30 p-3 bg-white/20 backdrop-blur-md rounded-full text-white"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
