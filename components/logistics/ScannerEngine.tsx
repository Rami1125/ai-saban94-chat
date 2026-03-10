"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { MapPin, Scan } from "lucide-react";

const SABAN_BRANCHES = [
  { id: 'harash', name: 'סניף החרש 10', lat: 32.148, lng: 34.901 },
  { id: 'talmid', name: 'סניף התלמיד 6', lat: 32.152, lng: 34.892 }
];

export default function ScannerEngine({ onScan }: { onScan: (sku: string) => void }) {
  const [currentBranch, setCurrentBranch] = useState<string>("מזהה מיקום...");

  useEffect(() => {
    // זיהוי סניף אוטומטי לפי מיקום גיאוגרפי
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = SABAN_BRANCHES.reduce((prev, curr) => {
          const dist = Math.sqrt(Math.pow(latitude - curr.lat, 2) + Math.pow(longitude - curr.lng, 2));
          return dist < prev.dist ? { branch: curr.name, dist } : prev;
        }, { branch: SABAN_BRANCHES[0].name, dist: 999 });
        setCurrentBranch(nearest.branch);
      });
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-2xl border border-blue-100 mb-4">
        <MapPin size={16} className="text-blue-600 animate-pulse" />
        <span className="text-xs font-black text-blue-700">נוכחות: {currentBranch}</span>
      </div>
      <div id="reader" className="rounded-[2.5rem] overflow-hidden border-4 border-slate-900 shadow-2xl"></div>
    </div>
  );
}
