"use client";
import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, limitToLast, query } from 'firebase/database';

const firebaseConfig = { databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app" };
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export default function DiagnosticPage() {
  const [rawIncoming, setRawIncoming] = useState<any[]>([]);

  useEffect(() => {
    const inRef = query(ref(db, 'rami/incoming'), limitToLast(5));
    return onValue(inRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRawIncoming(Object.entries(data).map(([id, val]) => ({ id, val })));
      }
    });
  }, []);

  return (
    <div className="p-6 font-mono text-xs bg-black text-green-400 min-h-screen" dir="ltr">
      <h1 className="text-xl font-bold mb-4 text-white">Saban OS - Raw Data Debugger</h1>
      <div className="space-y-6">
        {rawIncoming.map((item) => (
          <div key={item.id} className="border border-green-900 p-4 rounded bg-gray-900">
            <div className="text-blue-400 mb-2">ID: {item.id}</div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(item.val, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
