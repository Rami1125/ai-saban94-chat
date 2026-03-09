"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerProps {
  onScan: (code: string) => void;
}

export default function Scanner({ onScan }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const qrCodeRef = useRef<Html5Qrcode | null>(null);

  // פונקציה להשמעת צליל סריקה
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.error(e); }
  };

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (err) { console.error(err); }
    }
  };

  const startScanner = async () => {
    setError(null);
    setIsStarted(false);
    await stopScanner();

    // בדיקה אם ה-div קיים
    if (!document.getElementById("reader")) return;

    const scanner = new Html5Qrcode("reader");
    qrCodeRef.current = scanner;

    const config = {
      fps: 20,
      qrbox: { width: 300, height: 150 },
      aspectRatio: 1.0,
    };

    try {
      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          if (decodedText !== lastCode) {
            setLastCode(decodedText);
            playBeep();
            onScan(decodedText);
          }
        },
        () => {} // שגיאות חיפוש שקטות
      );
      setIsStarted(true);
      setPermissionStatus('granted');
    } catch (err: any) {
      console.error("Scanner Error:", err);
      setPermissionStatus('denied');
      setError("גישה למצלמה נכשלה. וודא שהרשאות מאושרות בהגדרות הדפדפן.");
    }
  };

  // פונקציה לבדיקה וביצוע בקשת הרשאה חזקה
  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // הצלחנו לקבל סטרים, נסגור אותו ונפעיל את הסורק
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      startScanner();
    } catch (err) {
      setPermissionStatus('denied');
      setError("המצלמה חסומה. לחץ על סמל המנעול בשורת הכתובת ואפשר גישה למצלמה.");
    }
  };

  useEffect(() => {
    // אתחול ראשוני
    handleRequestPermission();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4" dir="rtl">
      <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-900 bg-slate-950 aspect-square shadow-2xl">
        
        {/* הוידאו עצמו */}
        <div id="reader" className="w-full h-full object-cover"></div>

        {/* ממשק חסימת הרשאה */}
        {permissionStatus === 'denied' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/95 p-8 text-center animate-in fade-in duration-300">
            <div className="bg-red-500/20 p-4 rounded-full mb-4">
              <ShieldCheck className="text-red-500" size={40} />
            </div>
            <h3 className="text-white font-black text-xl mb-2">גישה למצלמה חסומה</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              כדי להשתמש במסופון, יש ללחוץ על <b>סמל המנעול</b> בשורת הכתובת למעלה ולאשר את המצלמה.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button onClick={handleRequestPermission} className="bg-blue-600 hover:bg-blue-500 rounded-2xl font-black h-14 shadow-lg shadow-blue-900/20">
                נסה להפעיל שוב
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()} className="text-slate-400 hover:text-white">
                רענן דף
              </Button>
            </div>
          </div>
        )}

        {/* לייזר סריקה ועיצוב */}
        {isStarted && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-[300px] h-[150px] border-2 border-blue-500/50 rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] relative overflow-hidden">
              {/* פינות בולטות */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
              {/* קו לייזר נע */}
              <div className="absolute w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
            </div>
          </div>
        )}

        {/* טעינה */}
        {!isStarted && permissionStatus !== 'denied' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white">
            <Camera className="animate-pulse text-blue-500 mb-2" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">מתחבר למסופון...</p>
          </div>
        )}
      </div>

      {/* הודעת קליטה מוצלחת */}
      {lastCode && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">מק"ט שנסרק</p>
              <p className="font-mono text-sm font-black text-slate-900">{lastCode}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLastCode(null)} className="text-slate-400">נקה</Button>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          position: absolute;
          animation: scan 2s linear infinite;
        }
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
